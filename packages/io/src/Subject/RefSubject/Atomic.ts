import type { Runtime } from "@fncts/io/IO/runtime";
import type { UnsafeSink } from "@fncts/io/Push/Sink";
import type { Scope } from "@fncts/io/Scope";

import { IO } from "@fncts/io/IO";
import { PSynchronizedInternal } from "@fncts/io/Ref/Synchronized/definition";

import { FutureRef } from "../DeferredRef.js";
import { HoldSubject } from "../Hold.js";
import { Derived } from "./Derived.js";
import { PRefSubject } from "./RefSubject.js";

export class Atomic<R, E, A> extends PRefSubject<never, never, E, E, E, A, A> {
  constructor(
    readonly fiberId: FiberId,
    readonly initial: IO<R, E, A>,
    readonly runtime: Runtime<R>,
    readonly scope: Scope.Closeable,
  ) {
    super();
  }

  readonly semaphore                = Semaphore.unsafeMake(1);
  private subject                   = new HoldSubject<E, A>();
  private futureRef                 = new FutureRef(this.fiberId, this.subject.value);
  private fiber: Fiber<E, A> | null = null;

  readonly interrupt = IO.fiberIdWith((fiberId) => {
    this.futureRef.reset();
    return this.scope.close(Exit.interrupt(fiberId)) > this.interruptFiber > this.subject.interrupt;
  });

  readonly subscribers = this.subject.subscribers;

  run<R1>(sink: UnsafeSink<R1, E, A>): IO<Scope | R1, never, void> {
    return this.subject.run(sink);
  }

  onFailure(cause: Cause<E>): IO<never, never, void> {
    const exit = Exit.failCause(cause);
    return IO.defer(() => {
      if (this.futureRef.done(exit)) {
        return this.sendEvent(exit);
      } else {
        return IO.unit;
      }
    });
  }

  onSuccess = this.set;

  modify<C>(f: (a: A) => readonly [C, A], __tsplusTrace?: string): IO<never, E, C> {
    return this.get.flatMap((a) => {
      const [c, a1] = f(a);
      return this.set(a1).as(c);
    });
  }

  modifyIO<R1, E1, B>(f: (a: A) => IO<R1, E1, readonly [B, A]>, __tsplusTrace?: string): IO<R1, E1 | E, B> {
    return this.get.flatMap(f).flatMap(([b, a]) => this.set(a).as(b));
  }

  match<EC, ED, C, D>(
    setError: (_: E) => EC,
    getError: (_: E) => ED,
    set: (_: C) => Either<EC, A>,
    get: (_: A) => Either<ED, D>,
    __tsplusTrace?: string,
  ): PSynchronizedInternal<never, never, EC, ED, C, D> {
    return this.matchIO(setError, getError, set, get);
  }

  matchAll<EC, ED, C, D>(
    setError: (_: E) => EC,
    getError: (_: E) => ED,
    setGetError: (_: E) => EC,
    set: (_: C) => (_: A) => Either<EC, A>,
    get: (_: A) => Either<ED, D>,
    __tsplusTrace?: string,
  ): PSynchronizedInternal<never, never, EC, ED, C, D> {
    return this.matchAllIO(setError, getError, setGetError, set, get);
  }

  matchIO<RC, RD, EC, ED, C, D>(
    setError: (_: E) => EC,
    getError: (_: E) => ED,
    set: (_: C) => IO<RC, EC, A>,
    get: (_: A) => IO<RD, ED, D>,
    __tsplusTrace?: string,
  ): PSynchronizedInternal<RC, RD, EC, ED, C, D> {
    return new PSynchronizedInternal(
      this.semaphore,
      this.get.matchIO((e) => IO.failNow(getError(e)), get),
      (c) => set(c).flatMap((a) => this.set(a).mapError(setError)),
    );
  }

  matchAllIO<RC, RD, EC, ED, C, D>(
    setError: (_: E) => EC,
    getError: (_: E) => ED,
    setGetError: (_: E) => EC,
    set: (_: C) => (_: A) => IO<RC, EC, A>,
    get: (_: A) => IO<RD, ED, D>,
    __tsplusTrace?: string,
  ): PSynchronizedInternal<RC, RD, EC, ED, C, D> {
    return new PSynchronizedInternal(
      this.semaphore,
      this.get.matchIO((e) => IO.failNow(getError(e)), get),
      (c) =>
        this.get.matchIO(
          (e) => IO.failNow(setGetError(e)),
          (b) => set(c)(b).flatMap((a) => this.set(a).mapError(setError)),
        ),
    );
  }

  matchIOSubject<RC, RD, EI, EC, ED, C, D>(
    mapSetError: (_: E) => EC,
    mapGetError: (_: E) => ED,
    mapErrorInput: (_: EI) => E,
    mapSetErrorInput: (_: EC) => E,
    mapSet: (_: C) => IO<RC, EC, A>,
    mapGet: (_: A) => IO<RD, ED, D>,
    __tsplusTrace?: string,
  ): PRefSubject<RC, RD, EI, ED, EC, C, D> {
    return new Derived((f) =>
      f({
        ref: this,
        mapSetError,
        mapGetError,
        mapErrorInput,
        mapSetErrorInput,
        mapSet,
        mapGet,
      }),
    );
  }

  set(a: A, __tsplusTrace?: string): IO<never, never, void> {
    const exit = Exit.succeed(a);
    return IO.defer(() => {
      if (this.futureRef.done(exit)) {
        return this.sendEvent(exit);
      } else {
        return IO.unit;
      }
    });
  }

  get get(): IO<never, E, A> {
    return this.getOrInit(false);
  }

  private sendEvent(exit: Exit<E, A>) {
    return exit.match(
      (cause) => this.subject.onFailure(cause).provideEnvironment(this.runtime.environment),
      (value) => this.subject.onSuccess(value).provideEnvironment(this.runtime.environment),
    );
  }

  private getOrInit(lock: boolean) {
    return IO.defer(() => {
      if (this.fiber === null && this.futureRef.current.get.isNothing()) {
        return this.init(lock) > this.futureRef;
      } else {
        return this.futureRef;
      }
    });
  }

  private interruptFiber = IO.defer(() => {
    if (this.fiber) {
      return this.fiber.interrupt;
    } else {
      return IO.unit;
    }
  });

  private init(lock: boolean) {
    const maybeWithLock = lock ? this.semaphore.withPermits(1) : Function.identity;

    const initialize = maybeWithLock(
      this.initial.provideEnvironment(this.runtime.environment).onExit((exit) =>
        IO(() => {
          this.fiber = null;
          this.futureRef.done(exit);
        }),
      ),
    );

    return initialize.forkIn(this.scope).flatMap((fiber) => IO((this.fiber = fiber)));
  }
}
