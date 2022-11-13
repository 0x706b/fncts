import type { _A, _E, _R } from "@fncts/base/types";

import { AtomicReference } from "@fncts/base/internal/AtomicReference";

import { Emitter, Push } from "./definition.js";
import { earlyExit, onEarlyExit } from "./internal.js";

/**
 * @tsplus pipeable fncts.io.Push as
 */
export function as<B>(b: Lazy<B>) {
  return <R, E, A>(self: Push<R, E, A>): Push<R, E, B> => {
    return self.map(b);
  };
}

/**
 * @tsplus static fncts.io.PushOps combineLatest
 */
export function combineLatest<A extends ReadonlyArray<Push<any, any, any>>>(
  streams: [...A],
): Push<_R<A[number]>, _E<A[number]>, { [K in keyof A]: [A[K]] extends [Push<any, any, infer A>] ? A : never }>;
export function combineLatest<R, E, A>(streams: Iterable<Push<R, E, A>>): Push<R, E, ReadonlyArray<A>>;
export function combineLatest<R, E, A>(streams: Iterable<Push<R, E, A>>): Push<R, E, ReadonlyArray<A>> {
  return Push((emitter) =>
    Do((Δ) => {
      const size          = streams.size;
      const ref: Array<A> = Δ(IO(Array(size)));
      const latch         = Δ(CountdownLatch(size));
      const emitIfReady   = IO(ref.filter((a) => a != null)).flatMap((as) =>
        as.length === size ? emitter.emit(as) : IO.unit,
      );
      Δ(
        IO.foreachWithIndex(
          streams,
          (i, stream) =>
            stream.run(
              Emitter(
                (value) => IO((ref[i] = value)) > emitIfReady,
                (cause) => emitter.failCause(cause),
                latch.countDown,
              ),
            ).forkScoped,
        ),
      );
      Δ(latch.await > emitter.end);
    }),
  );
}

/**
 * @tsplus pipeable fncts.io.PushOps combineLatestWith
 */
export function combineLatestWith<A, R1, E1, B, C>(that: Push<R1, E1, B>, f: (a: A, b: B) => C) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, C> => {
    return Push.combineLatest([self, that]).map(([a, b]) => f(a, b));
  };
}

/**
 * @tsplus pipeable fncts.io.Push debounce
 */
export function debounce(duration: Lazy<Duration>) {
  return <R, E, A>(self: Push<R, E, A>): Push<R, E, A> => {
    return Push((emitter) =>
      Do((Δ) => {
        const ref   = Δ(Ref.Synchronized.make<Fiber<never, unknown> | null>(null));
        const latch = Δ(CountdownLatch(1));
        Δ(
          self.run(
            Emitter(
              (value) =>
                ref.updateIO((previous) =>
                  Do((Δ) => {
                    Δ(IO.defer(previous ? previous.interrupt : latch.increment));
                    return Δ(IO.acquireRelease(emitter.emit(value).delay(duration), () => latch.countDown).forkScoped);
                  }),
                ),
              (cause) => emitter.failCause(cause),
              latch.countDown,
            ),
          ),
        );
        Δ(latch.await > emitter.end);
      }),
    );
  };
}

/**
 * @tsplus static fncts.io.PushOps defer
 */
export function defer<R, E, A>(self: Lazy<Push<R, E, A>>): Push<R, E, A> {
  return Push((emitter) => IO(self).flatMap((push) => push.run(emitter)));
}

/**
 * @tsplus pipeable fncts.io.Push flatMapConcurrentBounded
 */
export function flatMapConcurrentBounded<A, R1, E1, B>(f: (a: A) => Push<R1, E1, B>, concurrency: number) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> => {
    return Push(<R2>(emitter: Emitter<R | R1 | R2, E | E1, B>) =>
      Do((Δ) => {
        const semaphore = Δ(TSemaphore(concurrency).commit);
        Δ(self.flatMapConcurrentUnbounded((a) => f(a).transform((io) => semaphore.withPermit(io))).run(emitter));
      }),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Push flatMapConcurrentUnbounded
 */
export function flatMapConcurrentUnbounded<A, R1, E1, B>(f: (a: A) => Push<R1, E1, B>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> => {
    return Push((emitter) =>
      Do((Δ) => {
        const latch = Δ(CountdownLatch(1));
        Δ(
          self.run(
            Emitter(
              (value) =>
                latch.increment > f(value).run(Emitter(emitter.emit, emitter.failCause, latch.countDown)).forkScoped,
              emitter.failCause,
              latch.countDown,
            ),
          ),
        );
        Δ(latch.await > emitter.end);
      }),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Push flatMapConcurrent
 */
export function flatMapConcurrent<A, R1, E1, B>(f: (a: A) => Push<R1, E1, B>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> => {
    return Push.unwrap(
      IO.concurrency.map((concurrency) =>
        concurrency.match(
          () => self.flatMapConcurrentUnbounded(f),
          (n) => self.flatMapConcurrentBounded(f, n),
        ),
      ),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Push flatMap
 */
export function flatMap<A, R1, E1, B>(f: (a: A) => Push<R1, E1, B>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> => {
    return self.flatMapConcurrentBounded(f, 1);
  };
}

/**
 * @tsplus getter fncts.io.Push flatten
 */
export function flatten<R, E, R1, E1, A>(self: Push<R, E, Push<R1, E1, A>>): Push<R | R1, E | E1, A> {
  return self.flatMap(Function.identity);
}

/**
 * @tsplus static fncts.io.PushOps fromIO
 */
export function fromIO<R, E, A>(io: Lazy<IO<R, E, A>>): Push<R, E, A> {
  return Push(
    (emitter) =>
      IO.defer(io).matchCauseIO(
        (cause) => emitter.failCause(cause),
        (value) => emitter.emit(value),
      ) > emitter.end,
  );
}

/**
 * @tsplus static fncts.io.PushOps fromAsyncIterable
 */
export function fromAsyncIterable<A>(iterable: AsyncIterable<A>): Push<never, never, A> {
  return Push((emitter) => IO.defer(fromAsyncIterableLoop(iterable[Symbol.asyncIterator](), emitter)));
}

function fromAsyncIterableLoop<A, R>(
  iterator: AsyncIterator<A>,
  emitter: Emitter<R, never, A>,
  __tsplusTrace?: string,
): IO<R, never, void> {
  return IO.fromPromiseHalt(iterator.next).matchCauseIO(
    (cause) => emitter.failCause(cause) > emitter.end,
    (result) => (result.done ? emitter.end : emitter.emit(result.value) > fromAsyncIterableLoop(iterator, emitter)),
  );
}

/**
 * @tsplus static fncts.io.PushOps fromIterable
 */
export function fromIterable<A>(iterable: Iterable<A>): Push<never, never, A> {
  return Push((emitter) => IO.defer(fromIterableLoop(iterable[Symbol.iterator](), emitter)));
}

function fromIterableLoop<A, R>(iterator: Iterator<A>, emitter: Emitter<R, never, A>): IO<R, never, void> {
  return IO.defer(() => {
    const value = iterator.next();
    return value.done ? emitter.end : emitter.emit(value.value) > fromIterableLoop(iterator, emitter);
  });
}

/**
 * @tsplus getter fncts.io.Push multicast
 */
export function multicast<R, E, A>(self: Push<R, E, A>): Push<R, E, A> {
  return new Multicast(self);
}

interface MulticastObserver<E, A> {
  readonly emitter: Emitter<any, E, A>;
  readonly environment: Environment<any>;
  readonly future: Future<never, void>;
}

export class Multicast<R, E, A> implements Push<R, E, A>, Emitter<never, E, A> {
  declare _R: () => R;
  declare _E: () => E;
  declare _A: () => A;
  protected observers: Array<MulticastObserver<E, A>> = [];
  protected fiber: Fiber<never, unknown> | undefined;
  constructor(readonly push: Push<R, E, A>) {}

  run<R1>(emitter: Emitter<R1, E, A>): IO<R | R1 | Scope, never, unknown> {
    return Do((Δ) => {
      const environment = Δ(IO.environment<R1>());
      const future      = Δ(Future.make<never, void>());
      Δ(
        IO.defer(() => {
          this.observers.push({ emitter, environment, future });
          if (this.fiber) {
            return IO.unit;
          } else {
            return this.push
              .run(this)
              .schedule(Schedule.asap)
              .forkScoped.tap((fiber) => IO((this.fiber = fiber)));
          }
        }),
      );
      return Δ(future.await);
    });
  }

  emit(value: A) {
    return IO.defer(IO.foreachDiscard(this.observers.slice(), (observer) => this.runEvent(value, observer)));
  }

  failCause(cause: Cause<E>) {
    return (
      IO.defer(IO.foreachDiscard(this.observers.slice(), (observer) => this.runFailCause(cause, observer))) >
      IO.defer(this.cleanup())
    );
  }

  get end() {
    return (
      IO.defer(IO.foreachDiscard(this.observers.slice(), (observer) => this.runEnd(observer))) >
      IO.defer(this.cleanup())
    );
  }

  protected runEvent(value: A, observer: MulticastObserver<E, A>) {
    return observer.emitter
      .emit(value)
      .tapErrorCause((cause) => this.runFailCause(cause, observer))
      .provideEnvironment(observer.environment);
  }

  protected runFailCause(cause: Cause<E>, observer: MulticastObserver<E, A>) {
    this.observers.splice(this.observers.indexOf(observer), 1);
    return observer.emitter.failCause(cause).fulfill(observer.future).provideEnvironment(observer.environment);
  }

  protected runEnd(observer: MulticastObserver<E, A>) {
    this.observers.splice(this.observers.indexOf(observer), 1);
    return observer.emitter.end.fulfill(observer.future).provideEnvironment(observer.environment);
  }

  protected cleanup() {
    if (this.fiber) {
      return this.fiber.interrupt > IO((this.fiber = undefined));
    }
    return IO.unit;
  }
}

/**
 * @tsplus getter fncts.io.Push hold
 */
export function hold<R, E, A>(self: Push<R, E, A>): Push<R, E, A> {
  return new Hold(self);
}

export class Hold<R, E, A> extends Multicast<R, E, A> {
  readonly value = new AtomicReference(Nothing<A>());
  protected pendingEmitters: Array<readonly [Emitter<unknown, E, A>, Array<A>]> = [];
  protected scheduledFiber: Fiber<any, any> | null = null;

  constructor(readonly push: Push<R, E, A>) {
    super(push);
  }

  run<R1>(emitter: Emitter<R1, E, A>): IO<R | R1 | Scope, never, void> {
    if (this.shouldScheduleFlush()) {
      return this.scheduleFlush(emitter).flatMap(() => super.run(emitter));
    }

    const value = this.value.get;
    if (value.isJust() && this.observers.length === 0) {
      return emitter.emit(value.value).flatMap(() => super.run(emitter));
    }

    return super.run(emitter);
  }

  emit(value: A) {
    return IO.defer(() => {
      this.addValue(value);
      return this.flushPending().flatMap(() => super.emit(value));
    });
  }

  failCause(cause: Cause<E>) {
    return IO.defer(this.flushPending().flatMap(() => super.failCause(cause)));
  }

  get end() {
    return IO.defer(this.flushPending().flatMap(() => super.end));
  }

  protected shouldScheduleFlush() {
    return this.value.get.isJust() && this.observers.length > 0;
  }

  protected scheduleFlush<R>(observer: Emitter<R, E, A>) {
    this.pendingEmitters.push([
      observer,
      this.value.get.match(
        () => [],
        (a) => [a],
      ),
    ]);

    const interrupt     = this.scheduledFiber ? this.scheduledFiber.interruptAsFork(FiberId.none) : IO.unit;
    this.scheduledFiber = null;

    return (IO.yieldNow > interrupt.flatMap(() => this.flushPending())).forkScoped.tap((fiber) =>
      IO((this.scheduledFiber = fiber)),
    );
  }

  protected flushPending() {
    if (this.pendingEmitters.length === 0) {
      return IO.unit;
    }

    const emitters       = this.pendingEmitters;
    this.pendingEmitters = [];

    return IO.foreachDiscard(emitters, (pendingEmitter) => {
      return IO.defer(() => {
        const [emitter, values] = pendingEmitter;
        const observer          = this.observers.find((observer) => observer.emitter === emitter);
        if (!observer) {
          return IO.unit;
        }
        return IO.foreachDiscard(values, (value) => this.runEvent(value, observer));
      });
    });
  }

  protected addValue(value: A) {
    this.value.set(Just(value));
    this.pendingEmitters.forEach(([, values]) => {
      values.push(value);
    });
  }
}

/**
 * @tsplus pipeable fncts.io.Push map 1
 */
export function map<A, B>(f: (a: A) => B) {
  return <R, E>(self: Push<R, E, A>): Push<R, E, B> => {
    return self.mapIO((a) => IO.succeedNow(f(a)));
  };
}

/**
 * @tsplus pipeable fncts.io.Push mapError
 */
export function mapError<E, E1>(f: (e: E) => E1) {
  return <R, A>(self: Push<R, E, A>): Push<R, E1, A> => {
    return Push((emitter) =>
      self.run(
        Emitter(
          (value) => emitter.emit(value),
          (cause) => emitter.failCause(cause.map(f)),
          emitter.end,
        ),
      ),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Push mapErrorCause
 */
export function mapErrorCause<E, E1>(f: (cause: Cause<E>) => Cause<E1>) {
  return <R, A>(self: Push<R, E, A>): Push<R, E1, A> => {
    return Push((emitter) =>
      self.run(
        Emitter(
          (value) => emitter.emit(value),
          (cause) => emitter.failCause(f(cause)),
          emitter.end,
        ),
      ),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Push mapIO
 */
export function mapIO<A, R1, E1, B>(f: (a: A) => IO<R1, E1, B>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> =>
    Push((emitter) =>
      self.run(
        Emitter(
          (value) =>
            f(value).matchCauseIO(
              (cause) => emitter.failCause(cause),
              (b) => emitter.emit(b),
            ),
          (cause) => emitter.failCause(cause),
          emitter.end,
        ),
      ),
    );
}

/**
 * @tsplus pipeable fncts.io.Push merge
 */
export function merge<R1, E1, B>(that: Push<R1, E1, B>) {
  return <R, E, A>(self: Push<R, E, A>): Push<R | R1, E | E1, A | B> => {
    return Push.mergeAll([self, that]);
  };
}

/**
 * @tsplus static fncts.io.PushOps mergeAll
 */
export function mergeAll<A extends ReadonlyArray<Push<any, any, any>>>(
  streams: [...A],
): Push<_R<A[number]>, _E<A[number]>, _A<A[number]>>;
export function mergeAll<R, E, A>(streams: Iterable<Push<R, E, A>>): Push<R, E, A>;
export function mergeAll<R, E, A>(streams: Iterable<Push<R, E, A>>): Push<R, E, A> {
  return Push((emitter) =>
    Do((Δ) => {
      const latch = Δ(CountdownLatch(streams.size));
      Δ(
        streams.traverseIOConcurrent(
          (stream) =>
            stream.run(
              Emitter(
                (value) => emitter.emit(value),
                (cause) => emitter.failCause(cause),
                latch.countDown,
              ),
            ).forkScoped,
        ),
      );
      Δ(latch.await > emitter.end);
    }),
  );
}

/**
 * @tsplus static fncts.io.PushOps repeatIOMaybe
 */
export function repeatIOMaybe<R, E, A>(io: IO<R, Maybe<E>, A>, __tsplusTrace?: string): Push<R, E, A> {
  return Push.unfoldIO(undefined, () =>
    io
      .map((a) => Just([a, undefined] as const))
      .catchAll((maybeError) => maybeError.match(() => IO.succeedNow(Nothing()), IO.failNow)),
  );
}

/**
 * @tsplus getter fncts.io.Push runCollect
 */
export function runCollect<R, E, A>(self: Push<R, E, A>): IO<R | Scope, E, Conc<A>> {
  return IO.defer(() => {
    const out: Array<A> = [];
    return Future.make<E, void>().flatMap(
      (future) =>
        self.run(
          Emitter(
            (value) => IO(out.push(value)),
            (cause) => future.failCause(cause),
            future.succeed(undefined),
          ),
        ) >
        future.await >
        IO(Conc.fromArray(out)),
    );
  });
}

/**
 * @tsplus getter fncts.io.Push runDrain
 */
export function runDrain<R, E, A>(self: Push<R, E, A>): IO<R | Scope, E, void> {
  return Future.make<E, void>().flatMap(
    (future) =>
      self.run(
        Emitter(
          () => IO.unit,
          (cause) => future.failCause(cause),
          future.succeed(undefined),
        ),
      ) > future.await,
  );
}

/**
 * @tsplus static fncts.io.PushOps scoped
 */
export function scoped<R, E, A>(io: Lazy<IO<R, E, A>>, __tsplusTrace?: string): Push<Exclude<R, Scope>, E, A> {
  return Push(
    (emitter) =>
      IO.defer(io).scoped.matchCauseIO(
        (cause) => emitter.failCause(cause),
        (value) => emitter.emit(value),
      ) > emitter.end,
  );
}

/**
 * @tsplus static fncts.io.PushOps succeed
 */
export function succeed<A>(value: Lazy<A>): Push<never, never, A> {
  return Push.fromIO(IO.succeed(value));
}

/**
 * @tsplus pipeable fncts.io.PushOps switchMap
 */
export function switchMap<A, R1, E1, B>(f: (a: A) => Push<R1, E1, B>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> => {
    return Push(<R2>(emitter: Emitter<R2, E | E1, B>) =>
      Do((Δ) => {
        const current      = Δ(Ref.Synchronized.make<Fiber<never, void> | null>(null));
        const latch        = Δ(CountdownLatch(1));
        const innerEmitter = Emitter<R2, E | E1, B>(
          (value) => emitter.emit(value),
          (cause) => current.set(null) > emitter.failCause(cause),
          latch.countDown,
        );
        Δ(
          self.run(
            Emitter(
              (value) =>
                current.updateIO((fiber) =>
                  (fiber ? fiber.interrupt : latch.increment).zipRight(f(value).run(innerEmitter).forkScoped),
                ),
              (cause) => emitter.failCause(cause),
              latch.countDown,
            ),
          ),
        );
        Δ(latch.await > emitter.end);
      }),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Push transform
 */
export function transform<R1 = never>(f: <R, E, A>(io: IO<R, E, A>) => IO<R | R1, E, A>) {
  return <R, E, A>(self: Push<R, E, A>): Push<R | R1, E, A> => Push((emitter) => f(self.run(emitter)));
}

function unfoldLoop<S, A, R1>(
  s: S,
  f: (s: S) => Maybe<readonly [A, S]>,
  emitter: Emitter<R1, never, A>,
): IO<R1, never, void> {
  return f(s).match(
    () => emitter.end,
    ([a, s]) => emitter.emit(a) > unfoldLoop(s, f, emitter),
  );
}

/**
 * @tsplus static fncts.io.PushOps unfold
 */
export function unfold<S, A>(s: S, f: (s: S) => Maybe<readonly [A, S]>): Push<never, never, A> {
  return Push((emitter) => unfoldLoop(s, f, emitter));
}

function unfoldIOLoop<S, R, E, A, R1>(
  s: S,
  f: (s: S) => IO<R, E, Maybe<readonly [A, S]>>,
  emitter: Emitter<R1, E, A>,
): IO<R | R1, never, void> {
  return f(s)
    .flatMap((result) =>
      result.match(
        () => emitter.end,
        ([a, s]) => emitter.emit(a) > unfoldIOLoop(s, f, emitter),
      ),
    )
    .catchAllCause((cause) => emitter.failCause(cause));
}

/**
 * @tsplus static fncts.io.PushOps unfoldIO
 */
export function unfoldIO<S, R, E, A>(s: S, f: (s: S) => IO<R, E, Maybe<readonly [A, S]>>): Push<R, E, A> {
  return Push((emitter) => unfoldIOLoop(s, f, emitter));
}

/**
 * @tsplus pipeable fncts.io.Push untilFuture
 */
export function untilFuture<E1, B>(future: Future<E1, B>) {
  return <R, E, A>(self: Push<R, E, A>): Push<R, E | E1, A> => {
    return Push((emitter) =>
      Do((Δ) => {
        const futureFiber = Δ(
          future.await
            .matchCauseIO(
              (cause) => emitter.failCause(cause),
              () => IO.unit,
            )
            .zipRight(earlyExit).forkScoped,
        );
        const streamFiber = Δ(self.run(emitter).forkScoped);
        Δ(Fiber.joinAll([futureFiber, streamFiber])(onEarlyExit(emitter.end)));
      }),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Push untilPush
 */
export function untilPush<R1, E1, B>(signal: Push<R1, E1, B>) {
  return <R, E, A>(self: Push<R, E, A>): Push<R | R1, E | E1, A> => {
    return Push((emitter) =>
      Do((Δ) => {
        const signalFiber = Δ(
          signal.run(
            Emitter(
              () => earlyExit,
              (cause) => emitter.failCause(cause),
              earlyExit,
            ),
          ).forkScoped,
        );
        const streamFiber = Δ(self.run(emitter).forkScoped);
        Δ(Fiber.joinAll([signalFiber, streamFiber])(onEarlyExit(emitter.end)));
      }),
    );
  };
}

/**
 * @tsplus static fncts.io.PushOps unwrap
 */
export function unwrap<R, E, R1, E1, A>(io: IO<R, E, Push<R1, E1, A>>): Push<R | R1, E | E1, A> {
  return Push.fromIO(io).flatten;
}

/**
 * @tsplus static fncts.io.PushOps unwrapScoped
 */
export function unwrapScoped<R, E, R1, E1, A>(
  self: IO<R, E, Push<R1, E1, A>>,
  __tsplusTrace?: string,
): Push<R1 | Exclude<R, Scope>, E | E1, A> {
  return Push.scoped(self).flatten;
}

/**
 * @tsplus static fncts.io.PushOps never
 */
export const never = Push.fromIO(IO.never);
