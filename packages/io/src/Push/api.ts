import { AtomicReference } from "@fncts/base/internal/AtomicReference";
import { IO } from "@fncts/io/IO";
import { withExhaust, withSwitch, withUnboundedConcurrency } from "@fncts/io/Push/internal";

import { Push, PushTypeId, PushVariance, Sink } from "./definition.js";

/**
 * @tsplus pipeable fncts.io.Push as
 */
export function as<B>(b: Lazy<B>) {
  return <R, E, A>(self: Push<R, E, A>): Push<R, E, B> => {
    return self.map(b);
  };
}

interface UnsafeSink<E, A> {
  event: (value: A) => void;
  error: (cause: Cause<E>) => void;
}

/**
 * @tsplus static fncts.io.PushOps asyncInterrupt
 */
export function asyncInterrupt<R, E, A>(
  make: (emitter: UnsafeSink<E, A>) => Either<IO<R, never, void>, Push<R, E, A>>,
): Push<R, E, A> {
  return Push<R, E, A>(
    <R1>(sink: Sink<R | R1, E, A>) =>
      Do((Δ) => {
        const future  = Δ(Future.make<never, void>());
        const scope   = Δ(IO.scope);
        const runtime = Δ(IO.runtime<R | R1>());
        const unsafeSink: UnsafeSink<E, A> = {
          event: (value) => runtime.unsafeRunOrFork(sink.event(value).forkIn(scope)),
          error: (cause) => runtime.unsafeRunOrFork(sink.error(cause).fulfill(future).forkIn(scope)),
        };
        const eitherPush = Δ(IO(make(unsafeSink)));
        Δ(
          eitherPush.match({
            Left: (canceller) => future.await.onInterrupt(canceller),
            Right: (push) => push.run(sink),
          }),
        );
      }).scoped,
  );
}

/**
 * @tsplus static fncts.io.PushOps async
 */
export function async<E, A>(make: (sink: UnsafeSink<E, A>) => void): Push<never, E, A> {
  return Push.asyncInterrupt((sink) => {
    make(sink);
    return Either.left(IO.unit);
  });
}

/**
 * @tsplus static fncts.io.PushOps combineLatest
 */
export function combineLatest<A extends ReadonlyArray<Push<any, any, any>>>(
  streams: [...A],
): Push<Push.EnvironmentOf<A[number]>, Push.ErrorOf<A[number]>, { [K in keyof A]: Push.ValueOf<A[K]> }>;
export function combineLatest<R, E, A>(streams: Iterable<Push<R, E, A>>): Push<R, E, ReadonlyArray<A>>;
export function combineLatest<R, E, A>(streams: Iterable<Push<R, E, A>>): Push<R, E, ReadonlyArray<A>> {
  return Push((emitter) =>
    Do((Δ) => {
      const size          = streams.size;
      const ref: Array<A> = Δ(IO(Array(size)));
      const emitIfReady   = IO(ref.filter((a) => a != null)).flatMap((as) =>
        as.length === size ? emitter.event(as) : IO.unit,
      );
      Δ(
        IO.foreachConcurrent(streams.zipWithIndex, ([i, stream]) =>
          stream.run(
            Sink(
              (value) => IO((ref[i] = value)) > emitIfReady,
              (cause) => emitter.error(cause),
            ),
          ),
        ),
      );
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
    return self.switchMapIO((a) => IO.succeedNow(a).delay(duration));
  };
}

/**
 * @tsplus static fncts.io.PushOps defer
 */
export function defer<R, E, A>(self: Lazy<Push<R, E, A>>): Push<R, E, A> {
  return Push((emitter) => IO(self).flatMap((push) => push.run(emitter)));
}

/**
 * @tsplus pipeable fncts.io.Push exhaustMap
 */
export function exhaustMap<A, R1, E1, B>(f: (a: A) => Push<R1, E1, B>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> => {
    return Push((sink) => withExhaust((fork) => self.run(Sink((a) => fork(f(a).run(sink)), sink.error))));
  };
}

/**
 * @tsplus pipeable fncts.io.Push exhaustMapIO
 */
export function exhaustMapIO<A, R1, E1, B>(f: (a: A) => IO<R1, E1, B>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> => {
    return self.exhaustMap((a) => Push.fromIO(f(a)));
  };
}

/**
 * @tsplus pipeable fncts.io.Push filterIO
 */
export function filterIO<A, R1, E1>(predicate: (a: A) => IO<R1, E1, boolean>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, A> => {
    return Push((sink) =>
      self.run(
        Sink(
          (a) =>
            predicate(a)
              .flatMap((b) => (b ? sink.event(a) : IO.unit))
              .catchAllCause(sink.error),
          sink.error,
        ),
      ),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Push filterMapIO
 */
export function filterMapIO<A, R1, E1, B>(f: (a: A) => IO<R1, E1, Maybe<B>>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> => {
    return Push((sink) =>
      self.run(
        Sink(
          (a) =>
            f(a)
              .flatMap((mb) => mb.match(() => IO.unit, sink.event))
              .catchAllCause(sink.error),
          sink.error,
        ),
      ),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Push filter
 */
export function filter<A, B extends A>(refinement: Refinement<A, B>): <R, E>(self: Push<R, E, A>) => Push<R, E, B>;
export function filter<A>(predicate: Predicate<A>): <R, E>(self: Push<R, E, A>) => Push<R, E, A>;
export function filter<A>(predicate: Predicate<A>) {
  return <R, E>(self: Push<R, E, A>): Push<R, E, A> => {
    return Push((sink) => self.run(Sink((a) => (predicate(a) ? sink.event(a) : IO.unit), sink.error)));
  };
}

/**
 * @tsplus pipeable fncts.io.Push filterMap
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>) {
  return <R, E>(self: Push<R, E, A>): Push<R, E, B> => {
    return Push((sink) => self.run(Sink((a) => f(a).match(() => IO.unit, sink.event), sink.error)));
  };
}

/**
 * @tsplus pipeable fncts.io.Push flatMapConcurrentBounded
 */
export function flatMapConcurrentBounded<A, R1, E1, B>(f: (a: A) => Push<R1, E1, B>, concurrency: number) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> => {
    return Push(<R2>(emitter: Sink<R | R1 | R2, E | E1, B>) =>
      Do((Δ) => {
        const semaphore = Δ(Semaphore(concurrency));
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
    return Push((sink) => withUnboundedConcurrency((fork) => self.run(Sink((a) => fork(f(a).run(sink)), sink.error))));
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
  return Push((emitter) =>
    IO.defer(io).matchCauseIO(
      (cause) => emitter.error(cause),
      (value) => emitter.event(value),
    ),
  );
}

/**
 * @tsplus static fncts.io.PushOps fromAsyncIterable
 */
export function fromAsyncIterable<A>(iterable: AsyncIterable<A>): Push<never, never, A> {
  return Push(<R>(sink: Sink<R, never, A>) =>
    IO.asyncIO<R, never, void>((cb) => IO.defer(fromAsyncIterableLoop(iterable[Symbol.asyncIterator](), sink, cb))),
  );
}

function fromAsyncIterableLoop<A, R>(
  iterator: AsyncIterator<A>,
  sink: Sink<R, never, A>,
  cb: (io: UIO<void>) => void,
  __tsplusTrace?: string,
): IO<R, never, void> {
  return IO.fromPromiseHalt(iterator.next).matchCauseIO(
    (cause) => sink.error(cause),
    (result) => (result.done ? IO(cb(IO.unit)) : sink.event(result.value) > fromAsyncIterableLoop(iterator, sink, cb)),
  );
}

/**
 * @tsplus static fncts.io.PushOps fromIterable
 */
export function fromIterable<A>(iterable: Iterable<A>): Push<never, never, A> {
  return Push(<R>(sink: Sink<R, never, A>) =>
    IO.asyncIO<R, never, void>((cb) => IO.defer(fromIterableLoop(iterable[Symbol.iterator](), sink, cb))),
  );
}

function fromIterableLoop<A, R>(
  iterator: Iterator<A>,
  sink: Sink<R, never, A>,
  cb: (io: UIO<void>) => void,
): IO<R, never, void> {
  return IO.defer(() => {
    const value = iterator.next();
    return value.done ? IO(cb(IO.unit)) : sink.event(value.value) > fromIterableLoop(iterator, sink, cb);
  });
}

/**
 * @tsplus getter fncts.io.Push multicast
 */
export function multicast<R, E, A>(self: Push<R, E, A>): Push<R, E, A> {
  return new Multicast(self);
}

interface MulticastObserver<E, A> {
  readonly sink: Sink<any, E, A>;
  readonly environment: Environment<any>;
}

export class Multicast<R, E, A> implements Push<R, E, A>, Sink<never, E, A> {
  readonly [PushTypeId]: PushTypeId = PushTypeId;
  declare [PushVariance]: {
    readonly _R: (_: never) => R;
    readonly _E: (_: never) => E;
    readonly _A: (_: never) => A;
  };
  protected observers: Array<MulticastObserver<E, A>> = [];
  protected fiber: Fiber<never, unknown> | undefined;
  constructor(readonly push: Push<R, E, A>) {}

  run<R1>(sink: Sink<R1, E, A>): IO<R | R1, never, void> {
    return Do((Δ) => {
      const environment = Δ(IO.environment<R1>());
      Δ(
        IO.defer(() => {
          let io: URIO<R, void> = IO.unit;
          if (this.observers.push({ sink: sink, environment }) === 1) {
            io = this.push.run(this).forkDaemon.flatMap((fiber) => IO((this.fiber = fiber)));
          }
          return io > this.fiber!.await.ensuring(this.removeSink(sink));
        }),
      );
    });
  }

  event(value: A) {
    return IO.defer(IO.foreachDiscard(this.observers.slice(), (observer) => this.runValue(value, observer)));
  }

  error(cause: Cause<E>) {
    return IO.defer(IO.foreachDiscard(this.observers.slice(), (observer) => this.runError(cause, observer)));
  }

  protected runValue(value: A, observer: MulticastObserver<E, A>) {
    return observer.sink
      .event(value)
      .provideEnvironment(observer.environment)
      .catchAllCause(() => this.removeSink(observer.sink));
  }

  protected runError(cause: Cause<E>, observer: MulticastObserver<E, A>) {
    return observer.sink
      .error(cause)
      .provideEnvironment(observer.environment)
      .catchAllCause(() => this.removeSink(observer.sink));
  }

  protected removeSink(sink: Sink<any, E, A>) {
    return IO.defer(() => {
      if (this.observers.length === 0) {
        return IO.unit;
      }
      const index = this.observers.findIndex((observer) => observer.sink === sink);
      if (index > -1) {
        this.observers.splice(index, 1);
        if (this.observers.length === 0) {
          const interrupt = this.fiber!.interrupt;
          this.fiber      = undefined;
          return interrupt;
        }
      }
      return IO.unit;
    });
  }
}

/**
 * @tsplus getter fncts.io.Push hold
 */
export function hold<R, E, A>(self: Push<R, E, A>): Push<R, E, A> {
  return new Hold(self);
}

export class Hold<R, E, A> extends Multicast<R, E, A> {
  readonly current = new AtomicReference(Nothing<A>());

  constructor(public push: Push<R, E, A>) {
    super(push);
  }

  run<R1>(sink: Sink<R1, E, A>): IO<R | R1, never, void> {
    const current = this.current.get;

    if (current.isJust()) {
      return sink.event(current.value) > super.run(sink);
    }

    return super.run(sink);
  }

  event(value: A): IO<never, never, void> {
    return IO.defer(() => {
      this.current.set(Just(value));
      return super.event(value);
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
        Sink(
          (value) => emitter.event(value),
          (cause) => emitter.error(cause.map(f)),
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
        Sink(
          (value) => emitter.event(value),
          (cause) => emitter.error(f(cause)),
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
        Sink(
          (value) =>
            f(value).matchCauseIO(
              (cause) => emitter.error(cause),
              (b) => emitter.event(b),
            ),
          (cause) => emitter.error(cause),
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
): Push<Push.EnvironmentOf<A[number]>, Push.ErrorOf<A[number]>, Push.ValueOf<A[number]>>;
export function mergeAll<R, E, A>(streams: Iterable<Push<R, E, A>>): Push<R, E, A>;
export function mergeAll<R, E, A>(streams: Iterable<Push<R, E, A>>): Push<R, E, A> {
  return Push((sink) =>
    IO.foreachConcurrentDiscard(streams, (stream) =>
      stream.run(Sink(sink.event, (cause) => (cause.isInterruptedOnly ? IO.unit : sink.error(cause)))),
    ),
  );
}

/**
 * @tsplus pipeable fncts.io.Push observe
 */
export function observe<A, R1, E1>(f: (a: A) => IO<R1, E1, void>, __tsplusTrace?: string) {
  return <R, E>(self: Push<R, E, A>): IO<R | R1 | Scope, E | E1, void> => {
    return Do((Δ) => {
      const future = Δ(Future.make<E | E1, void>());
      const fiber  = Δ(
        self
          .run(
            Sink(
              (a) => f(a).catchAllCause((cause) => future.failCause(cause)),
              (cause) => future.failCause(cause),
            ),
          )
          .flatMap(() => future.succeed(undefined)).forkScoped,
      );

      Δ(future.await);
      Δ(fiber.interruptFork);
    });
  };
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
    return self.observe((a) => IO(out.push(a))).as(Conc.fromArray(out));
  });
}

/**
 * @tsplus getter fncts.io.Push runDrain
 */
export function runDrain<R, E, A>(self: Push<R, E, A>): IO<R | Scope, E, void> {
  return self.observe(() => IO.unit);
}

/**
 * @tsplus static fncts.io.PushOps scoped
 */
export function scoped<R, E, A>(io: Lazy<IO<R, E, A>>, __tsplusTrace?: string): Push<Exclude<R, Scope>, E, A> {
  return Push((emitter) =>
    IO.defer(io).scoped.matchCauseIO(
      (cause) => emitter.error(cause),
      (value) => emitter.event(value),
    ),
  );
}

/**
 * @tsplus static fncts.io.PushOps succeed
 */
export function succeed<A>(value: Lazy<A>): Push<never, never, A> {
  return Push.fromIO(IO.succeed(value));
}

/**
 * @tsplus pipeable fncts.io.Push switchMap
 */
export function switchMap<A, R1, E1, B>(f: (a: A) => Push<R1, E1, B>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> => {
    return Push((sink) => withSwitch((fork) => self.run(Sink((a) => fork(f(a).run(sink)), sink.error))));
  };
}

/**
 * @tsplus pipeable fncts.io.Push switchMapIO
 */
export function switchMapIO<A, R1, E1, B>(f: (a: A) => IO<R1, E1, B>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> => {
    return self.switchMap((a) => Push.fromIO(f(a)));
  };
}

/**
 * @tsplus pipeable fncts.io.Push tap
 */
export function tap<A, R1, E1, B>(f: (a: A) => IO<R1, E1, B>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, A> => {
    return Push((sink) => self.run(Sink((a) => f(a).matchCauseIO(sink.error, () => sink.event(a)), sink.error)));
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
  emitter: Sink<R1, never, A>,
): IO<R1, never, void> {
  return f(s).match(
    () => IO.unit,
    ([a, s]) => emitter.event(a) > unfoldLoop(s, f, emitter),
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
  emitter: Sink<R1, E, A>,
): IO<R | R1, never, void> {
  return f(s)
    .flatMap((result) =>
      result.match(
        () => IO.unit,
        ([a, s]) => emitter.event(a) > unfoldIOLoop(s, f, emitter),
      ),
    )
    .catchAllCause((cause) => emitter.error(cause));
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
    return Push(<R1>(sink: Sink<R1, E | E1, A>) =>
      IO.asyncIO<R | R1, never, void>((cb) => {
        const exit = IO(cb(IO.unit));
        return Do((Δ) => {
          const streamFiber = Δ(self.run(sink).fork);
          const futureFiber = Δ(
            future.await
              .matchCauseIO(
                (cause) => sink.error(cause),
                () => IO.unit,
              )
              .zipRight(exit).fork,
          );
          Δ(Fiber.joinAll([streamFiber, futureFiber]));
        });
      }),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Push untilPush
 */
export function untilPush<R1, E1, B>(signal: Push<R1, E1, B>) {
  return <R, E, A>(self: Push<R, E, A>): Push<R | R1, E | E1, A> => {
    return Push(<R2>(sink: Sink<R2, E | E1, A>) =>
      IO.asyncIO<R | R1 | R2, never, void>((cb) => {
        const exit = IO(cb(IO.unit));
        return Do((Δ) => {
          const signalFiber = Δ(
            signal.run(
              Sink(
                () => exit,
                (cause) => sink.error(cause),
              ),
            ).fork,
          );
          const streamFiber = Δ(self.run(sink).fork);
          Δ(Fiber.joinAll([signalFiber, streamFiber]));
        });
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
