import type { MergeStrategy } from "./MergeStrategy.js";
import type { UnsafeSink } from "@fncts/io/Push/Sink";

import { IO, IOTag } from "@fncts/io/IO";
import { Push, PushPrimitive, PushTag } from "@fncts/io/Push/definition";
import { FlattenStrategy, UnboundedStrategy } from "@fncts/io/Push/FlattenStrategy";
import { SyncProducer } from "@fncts/io/Push/Producer/SyncProducer";
import { Sink } from "@fncts/io/Push/Sink";
import { Scope } from "@fncts/io/Scope";

import { FromIO, FromScheduled, type IOProducer, Scheduled } from "./Producer/IOProducer.js";

class BracketExit<R, E, A, R1, E1, B, R2, E2, C> extends Push<R | R1 | R2, E | E1 | E2, B> {
  constructor(
    readonly acquire: IO<R, E, A>,
    readonly use: (a: A) => Push<R1, E1, B>,
    readonly release: (a: A, exit: Exit<unknown, unknown>) => IO<R2, E2, C>,
  ) {
    super();
  }

  run<R3>(sink: Push.UnsafeSink<R3, E | E1 | E2, B>): IO<R | R1 | R2 | R3, never, void> {
    return IO.bracketExit(
      this.acquire,
      (a) => this.use(a).run(sink),
      (a, exit) => this.release(a, exit).catchAllCause(sink.onFailure),
    ).catchAllCause(sink.onFailure);
  }
}

/**
 * @tsplus static fncts.io.PushOps bracketExit
 */
export function bracketExit<R, E, A, R1, E1, B, R2, E2, C>(
  acquire: IO<R, E, A>,
  use: (a: A) => Push<R1, E1, B>,
  release: (a: A, exit: Exit<unknown, unknown>) => IO<R2, E2, C>,
): Push<R | R1 | R2, E | E1 | E2, B> {
  return new BracketExit(acquire, use, release);
}

class CombineLatest<R, E, A> extends Push<R | Scope, E, ReadonlyArray<A>> {
  private static UNSET = Symbol();

  constructor(readonly streams: Iterable<Push<R, E, A>>) {
    super();
  }

  run<R1>(sink: UnsafeSink<R1, E, readonly A[]>): IO<Scope | R | R1, never, void> {
    return UnboundedStrategy.withFork((fork) =>
      Do((Δ) => {
        const size          = this.streams.size;
        const latch         = Δ(CountdownLatch(size));
        const ref: Array<A> = Array(size).fill(CombineLatest.UNSET, 0, size);
        const emitIfReady   = IO.defer(sink.onSuccess(ref)).whenIO(latch.isOpen);

        Δ(
          IO.foreach(this.streams.zipWithIndex, ([i, stream]) =>
            fork(
              stream.run(
                Sink.unsafeMake(
                  (value) =>
                    IO.defer(() => {
                      const indexEmpty = ref[i] === CombineLatest.UNSET;

                      ref[i] = value;

                      if (indexEmpty) {
                        return latch.countDown;
                      } else {
                        return IO.unit;
                      }
                    }) > emitIfReady,
                  (cause) => sink.onFailure(cause),
                ),
              ),
            ),
          ),
        );
      }),
    );
  }
}

/**
 * @tsplus static fncts.io.PushOps combineLatest
 */
export function combineLatest<A extends ReadonlyArray<Push<any, any, any>>>(
  streams: [...A],
): Push<Push.EnvironmentOf<A[number]> | Scope, Push.ErrorOf<A[number]>, { [K in keyof A]: Push.ValueOf<A[K]> }>;

export function combineLatest<R, E, A>(streams: Iterable<Push<R, E, A>>): Push<R | Scope, E, ReadonlyArray<A>>;
export function combineLatest<R, E, A>(streams: Iterable<Push<R, E, A>>): Push<R | Scope, E, ReadonlyArray<A>> {
  return new CombineLatest(streams);
}
class ContramapEnvironment<R, E, A, R1> extends Push<R1, E, A> {
  constructor(
    readonly self: Push<R, E, A>,
    readonly f: (r: Environment<R1>) => Environment<R>,
  ) {
    super();
  }

  run<R2>(sink: UnsafeSink<R2, E, A>): IO<R1 | R2, never, void> {
    return this.self.run(sink).contramapEnvironment(this.f);
  }
}

/**
 * @tsplus pipeable fncts.io.Push contramapEnvironment
 */
export function contramapEnvironment<R, R1>(f: (r: Environment<R1>) => Environment<R>) {
  return <E, A>(self: Push<R, E, A>): Push<R1, E, A> => new ContramapEnvironment(self, f);
}

class Defer<R, E, A> extends Push<R, E, A> {
  constructor(readonly self: Lazy<Push<R, E, A>>) {
    super();
  }
  run<R1>(sink: UnsafeSink<R1, E, A>): IO<R | R1, never, void> {
    return IO.defer(this.self().run(sink));
  }
}

/**
 * @tsplus static fncts.io.PushOps defer
 */
export function defer<R, E, A>(self: Lazy<Push<R, E, A>>): Push<R, E, A> {
  return new Defer(self);
}

/**
 * @tsplus static fncts.io.PushOps failCause
 */
export function failCause<E>(cause: Lazy<Cause<E>>): Push<never, E, never> {
  const op = new PushPrimitive(PushTag.FailCause) as any;
  op.i0    = cause;
  return op;
}

/**
 * @tsplus static fncts.io.PushOps failCauseNow
 */
export function failCauseNow<E>(cause: Cause<E>): Push<never, E, never> {
  const op = new PushPrimitive(PushTag.FailCause) as any;
  op.i0    = () => cause;
  return op;
}

/**
 * @tsplus static fncts.io.PushOps failNow
 */
export function failNow<E>(error: E): Push<never, E, never> {
  return Push.failCauseNow(Cause.fail(error));
}

class Filter<R, E, A, B extends A = A> extends Push<R, E, B> {
  constructor(
    readonly self: Push<R, E, A>,
    readonly p: Predicate<A>,
  ) {
    super();
  }
  run<R1>(sink: UnsafeSink<R1, E, B>): IO<R | R1, never, void> {
    return this.self.run(
      Sink.unsafeMake(
        (value) => {
          if (this.p(value)) {
            return sink.onSuccess(value as B);
          } else {
            return IO.unit;
          }
        },
        (cause) => sink.onFailure(cause),
      ),
    );
  }
}

/**
 * @tsplus pipeable fncts.io.Push filter
 */
export function filter<A, B extends A>(p: Refinement<A, B>): <R, E>(self: Push<R, E, A>) => Push<R, E, B>;
export function filter<A>(p: Predicate<A>): <R, E>(self: Push<R, E, A>) => Push<R, E, A>;
export function filter<A>(p: Predicate<A>) {
  return <R, E>(self: Push<R, E, A>): Push<R, E, A> => new Filter(self, p);
}
class FilterMap<R, E, A, B> extends Push<R, E, B> {
  constructor(
    readonly self: Push<R, E, A>,
    readonly f: (value: A) => Maybe<B>,
  ) {
    super();
  }
  run<R1>(sink: UnsafeSink<R1, E, B>): IO<R | R1, never, void> {
    return this.self.run(
      Sink.unsafeMake(
        (value) =>
          this.f(value).match(
            () => IO.unit,
            (b) => sink.onSuccess(b),
          ),
        (cause) => sink.onFailure(cause),
      ),
    );
  }
}

/**
 * @tsplus pipeable fncts.io.Push filterMap
 */
export function filterMap<A, B>(f: (value: A) => Maybe<B>) {
  return <R, E>(self: Push<R, E, A>): Push<R, E, B> => new FilterMap(self, f);
}

/**
 * @tsplus pipeable fncts.io.Push flatMap
 */
export function flatMap<A, R1, E1, B>(f: (a: A) => Push<R1, E1, B>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> => {
    const op = new PushPrimitive(PushTag.OnSuccess);
    op.i0    = self;
    op.i1    = f;
    return op;
  };
}

/**
 * @tsplus pipeable fncts.io.Push flatMapUnbounded
 */
export function flatMapUnbounded<A, R1, E1, B>(f: (a: A) => Push<R1, E1, B>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> =>
    self.flatMapWithStrategy(f, FlattenStrategy.Unbounded, ExecutionStrategy.concurrent);
}

/**
 * @tsplus pipeable fncts.io.Push flatMapWithStrategy
 */
export function flatMapWithStrategy<A, R1, E1, B>(
  f: (a: A) => Push<R1, E1, B>,
  flattenStrategy: FlattenStrategy,
  executionStrategy: ExecutionStrategy,
) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> => {
    const op = new PushPrimitive(PushTag.OnSuccessWithStrategy);
    op.i0    = self;
    op.i1    = f;
    op.i2    = flattenStrategy;
    op.i3    = executionStrategy;
    return op;
  };
}

/**
 * @tsplus static fncts.io.PushOps fromArray
 */
export function fromArray<A extends ReadonlyArray<any>>(array: A): Push<never, never, A[number]> {
  return Push.fromSyncProducer(SyncProducer.fromArray(array));
}
/**
 * @tsplus static fncts.io.PushOps fromIO
 */
export function fromIO<R, E, A>(io: IO<R, E, A>): Push<R, E, A> {
  const concrete = IO.concrete(io);
  switch (concrete._ioOpCode) {
    case IOTag.SucceedNow: {
      return Push.succeedNow(concrete.i0);
    }
    case IOTag.Fail: {
      return Push.failCause<any>(concrete.i0);
    }
    case IOTag.Sync: {
      return Push.fromSyncProducer(SyncProducer.fromSync(concrete.i0));
    }
    default: {
      return Push.fromIOProducer(new FromIO(io));
    }
  }
}
/**
 * @tsplus static fncts.io.PushOps fromIOProducer
 */
export function fromIOProducer<R, E, A>(producer: IOProducer<R, E, A>): Push<R, E, A> {
  const op = new PushPrimitive(PushTag.ProducerIO);
  op.i0    = producer;
  return op;
}

/**
 * @tsplus static fncts.io.PushOps fromIterable
 */
export function fromIterable<A>(iterable: Iterable<A>): Push<never, never, A> {
  return Push.fromSyncProducer(SyncProducer.fromIterable(iterable));
}

/**
 * @tsplus static fncts.io.PushOps fromScheduled
 */
export function fromScheduled<R, E, I, R1, O>(io: IO<R, E, I>, schedule: Schedule<R1, I, O>): Push<R | R1, E, O> {
  return Push.fromIOProducer(new FromScheduled(io, schedule));
}

/**
 * @tsplus static fncts.io.PushOps fromSyncProducer
 */
export function fromSyncProducer<A>(producer: SyncProducer<A>): Push<never, never, A> {
  const op = new PushPrimitive(PushTag.ProducerSync) as any;
  op.i0    = producer;
  return op;
}

/**
 * @tsplus static fncts.io.PushOps haltNow
 */
export function haltNow(error: unknown): Push<never, never, never> {
  return Push.failCauseNow(Cause.halt(error));
}

/**
 * @tsplus static fncts.io.PushOps __call
 */
export function makePush<R, E, A>(
  run: <R1>(sink: Push.UnsafeSink<R1, E, A>) => IO<R | R1, never, unknown>,
): Push<R, E, A> {
  const op = new PushPrimitive(PushTag.FromPush) as any;
  op.i0    = run;
  return op;
}

class Map<R, E, A, B> extends Push<R, E, B> {
  constructor(
    readonly self: Push<R, E, A>,
    readonly f: (a: A) => B,
  ) {
    super();
  }
  run<R1>(sink: UnsafeSink<R1, E, B>): IO<R | R1, never, void> {
    return this.self.run(
      Sink.unsafeMake(
        (value) => sink.onSuccess(this.f(value)),
        (cause) => sink.onFailure(cause),
      ),
    );
  }
}

/**
 * @tsplus pipeable fncts.io.Push map
 */
export function map<A, B>(f: (a: A) => B) {
  return <R, E>(self: Push<R, E, A>): Push<R, E, B> => new Map(self, f);
}

class MapAccum<R, E, A, S, B> extends Push<R, E, B> {
  constructor(
    readonly self: Push<R, E, A>,
    readonly seed: S,
    readonly f: (acc: S, a: A) => readonly [S, B],
  ) {
    super();
  }

  run<R1>(sink: UnsafeSink<R1, E, B>): IO<R | R1, never, void> {
    return IO.defer(() => {
      let acc = this.seed;
      return this.self.run(
        Sink.unsafeMake(
          (value) => {
            const [s, b] = this.f(acc, value);
            acc          = s;
            return sink.onSuccess(b);
          },
          (cause) => sink.onFailure(cause),
        ),
      );
    });
  }
}

/**
 * @tsplus pipeable fncts.io.Push mapAccum
 */
export function mapAccum<A, S, B>(seed: S, f: (acc: S, a: A) => readonly [S, B]) {
  return <R, E>(self: Push<R, E, A>): Push<R, E, B> => new MapAccum(self, seed, f);
}

class MapIO<R, E, A, R1, E1, B> extends Push<R | R1, E | E1, B> {
  constructor(
    readonly self: Push<R, E, A>,
    readonly f: (a: A) => IO<R1, E1, B>,
  ) {
    super();
  }

  run<R2>(sink: UnsafeSink<R2, E | E1, B>): IO<R | R1 | R2, never, void> {
    return this.self.run(
      Sink.unsafeMake(
        (value) => this.f(value).matchCauseIO(sink.onFailure, sink.onSuccess),
        (cause) => sink.onFailure(cause),
      ),
    );
  }
}

/**
 * @tsplus pipeable fncts.io.Push mapIO
 */
export function mapIO<A, R1, E1, B>(f: (a: A) => IO<R1, E1, B>) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> => new MapIO(self, f);
}

/**
 * @tsplus pipeable fncts.io.Push mapIOWithStrategy
 */
export function mapIOWithStrategy<A, R1, E1, B>(
  f: (a: A) => IO<R1, E1, B>,
  flattenStrategy: FlattenStrategy,
  executionStrategy: ExecutionStrategy,
) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> =>
    self.flatMapWithStrategy((a) => Push.fromIO(f(a)), flattenStrategy, executionStrategy);
}

class MergeWithStrategy<Ps extends ReadonlyArray<Push<any, any, any>>> extends Push<
  Push.EnvironmentOf<Ps[number]>,
  Push.ErrorOf<Ps[number]>,
  Push.ValueOf<Ps[number]>
> {
  constructor(
    readonly ps: Ps,
    readonly mergeStrategy: MergeStrategy,
  ) {
    super();
  }

  run<R1>(
    sink: UnsafeSink<R1, Push.ErrorOf<Ps[number]>, Push.ValueOf<Ps[number]>>,
  ): IO<Push.EnvironmentOf<Ps[number]> | R1, never, void> {
    return this.mergeStrategy.runMerge(this.ps, sink);
  }
}

/**
 * @tsplus static fncts.io.PushOps mergeWithStrategy
 */
export function mergeWithStrategy<Ps extends ReadonlyArray<Push<any, any, any>>>(
  streams: Ps,
  mergeStrategy: MergeStrategy,
): Push<Push.EnvironmentOf<Ps[number]>, Push.ErrorOf<Ps[number]>, Push.ValueOf<Ps[number]>> {
  return new MergeWithStrategy(streams, mergeStrategy);
}

/**
 * @tsplus pipeable fncts.io.Push observe
 */
export function observe<A, R1>(f: (a: A) => IO<R1, never, void>) {
  return <R, E>(self: Push<R, E, A>): IO<R | R1, never, void> => {
    return self.run(Sink.unsafeMake(f, (cause) => IO.failCause(cause).orHalt));
  };
}

class OrElseCause<R, E, A, R1, E1, B> extends Push<R | R1, E | E1, A | B> {
  constructor(
    readonly self: Push<R, E, A>,
    readonly that: (cause: Cause<E>) => Push<R1, E1, B>,
  ) {
    super();
  }
  run<R2>(sink: UnsafeSink<R2, E | E1, A | B>): IO<R | R1 | R2, never, void> {
    return this.self.run(Sink.unsafeMake(sink.onSuccess, (cause) => this.that(cause).run(sink)));
  }
}

/**
 * @tsplus pipeable fncts.io.Push orElseCause
 */
export function orElseCause<E, R1, E1, B>(that: (cause: Cause<E>) => Push<R1, E1, B>) {
  return <R, A>(self: Push<R, E, A>): Push<R | R1, E | E1, A | B> => new OrElseCause(self, that);
}

/**
 * @tsplus pipeable fncts.io.Push provideEnvironment
 */
export function provideEnvironment<R>(environment: Environment<R>) {
  return <E, A>(self: Push<R, E, A>): Push<never, E, A> => self.provideSomeEnvironment(environment);
}

class ProvideLayer<R, E, A, R1, E1, R2> extends Push<Exclude<R, R2> | R1, E | E1, A> {
  constructor(
    readonly self: Push<R, E, A>,
    readonly layer: Layer<R1, E1, R2>,
  ) {
    super();
  }
  run<R3>(sink: UnsafeSink<R3, E | E1, A>): IO<R1 | Exclude<R, R2> | R3, never, void> {
    return IO.bracketExit(
      Scope.make,
      (scope) =>
        this.layer
          .build(scope)
          .matchCauseIO(sink.onFailure, (environment) => this.self.run(sink).provideSomeEnvironment(environment)),
      (scope, exit) => scope.close(exit),
    );
  }
}

/**
 * @tsplus pipeable fncts.io.Push provideLayer
 */
export function provideLayer<R1, E1, R2>(layer: Layer<R1, E1, R2>) {
  return <R, E, A>(self: Push<R, E, A>): Push<Exclude<R, R2> | R1, E | E1, A> => new ProvideLayer(self, layer);
}

/**
 * @tsplus pipeable fncts.io.Push provideSomeEnvironment
 */
export function provideSomeEnvironment<R1>(environment: Environment<R1>) {
  return <R, E, A>(self: Push<R, E, A>): Push<Exclude<R, R1>, E, A> =>
    self.contramapEnvironment((r) => r.union(environment));
}

/**
 * @tsplus static fncts.io.PushOps schedule
 */
export function schedule<R, E, A, R1, O>(io: IO<R, E, A>, schedule: Schedule<R1, unknown, O>): Push<R | R1, E, A> {
  return Push.fromIOProducer(new Scheduled(io, schedule));
}

/**
 * @tsplus static fncts.io.PushOps succeed
 */
export function succeed<A>(value: Lazy<A>): Push<never, never, A> {
  return Push.fromSyncProducer(SyncProducer.fromSync(value));
}

/**
 * @tsplus static fncts.io.PushOps succeedNow
 */
export function succeedNow<A>(value: A): Push<never, never, A> {
  return Push.fromSyncProducer(SyncProducer.Success(value));
}

/**
 * @tsplus pipeable fncts.io.Push switchMap
 */
export function switchMap<A, R1, E1, B>(f: (a: A) => Push<R1, E1, B>, executionStrategy?: ExecutionStrategy) {
  return <R, E>(self: Push<R, E, A>): Push<R | R1, E | E1, B> =>
    self.flatMapWithStrategy(f, FlattenStrategy.Switch, executionStrategy ?? ExecutionStrategy.sequential);
}

/**
 * @tsplus pipeable fncts.io.Push transform
 */
export function transform<R, R1>(f: (io: IO<R, never, void>) => IO<R1, never, void>) {
  return <E, A>(self: Push<R, E, A>): Push<R | R1, E, A> => {
    const op = new PushPrimitive(PushTag.Transform);
    op.i0    = self;
    op.i1    = f;
    return op;
  };
}

class Unwrap<R, E, R1, E1, A> extends Push<R | R1, E | E1, A> {
  constructor(readonly io: IO<R, E, Push<R1, E1, A>>) {
    super();
  }
  run<R2>(sink: UnsafeSink<R2, E | E1, A>): IO<R | R1 | R2, never, void> {
    return this.io.matchCauseIO(
      (cause) => sink.onFailure(cause),
      (stream) => stream.run(sink),
    );
  }
}

/**
 * @tsplus static fncts.io.PushOps unwrap
 */
export function unwrap<R, E, R1, E1, A>(io: IO<R, E, Push<R1, E1, A>>): Push<R | R1, E | E1, A> {
  return new Unwrap(io);
}
