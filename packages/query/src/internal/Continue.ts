import type { Described } from "@fncts/query/Described";
import type { Request } from "@fncts/query/Request";

import { QueryFailure } from "../QueryFailure.js";

export const ContinueTypeId = Symbol.for("fncts.query.Continue");
export type ContinueTypeId = typeof ContinueTypeId;

export const ContinueVariance = Symbol.for("fncts.query.Continue.Variance");
export type ContinueVariance = typeof ContinueVariance;

/**
 * @tsplus type fncts.query.Continue
 * @tsplus companion fncts.query.ContinueOps
 */
export abstract class Continue<R, E, A> {
  readonly [ContinueTypeId]: ContinueTypeId = ContinueTypeId;
  declare [ContinueVariance]: {
    readonly _R: (_: never) => R;
    readonly _E: (_: never) => E;
    readonly _A: (_: never) => A;
  };
}

export const enum ContinueTag {
  Effect,
  Get,
}

/**
 * @tsplus companion fncts.query.Continue.EffectOps
 */
export class Effect<R, E, A> extends Continue<R, E, A> {
  readonly _tag = ContinueTag.Effect;
  constructor(readonly query: Query<R, E, A>) {
    super();
  }
}

/**
 * @tsplus companion fncts.query.Continue.GetOps
 */
export class Get<E, A> extends Continue<never, E, A> {
  readonly _tag = ContinueTag.Get;
  constructor(readonly io: FIO<E, A>) {
    super();
  }
}

type Concrete<R, E, A> = Effect<R, E, A> | Get<E, A>;

function concrete<R, E, A>(_: Continue<R, E, A>): asserts _ is Concrete<R, E, A> {
  //
}

/**
 * @tsplus static fncts.query.Continue.EffectOps __call
 * @tsplus static fncts.query.ContinueOps effect
 */
export function effect<R, E, A>(query: Query<R, E, A>): Continue<R, E, A> {
  return new Effect(query);
}

/**
 * @tsplus static fncts.query.Continue.GetOps __call
 * @tsplus static fncts.query.ContinueOps get
 */
export function get<E, A>(io: FIO<E, A>): Continue<never, E, A> {
  return new Get(io);
}

/**
 * @tsplus static fncts.query.ContinueOps __call
 */
export function makeContinue<R, E, A extends Request<E, B>, B>(
  request: A,
  dataSource: DataSource<R, A>,
  ref: Ref<Maybe<Either<E, B>>>,
  __tsplusTrace?: string,
): Continue<R, E, B> {
  return Continue.get(
    ref.get.flatMap((m) =>
      m.match(
        () => IO.haltNow(new QueryFailure(dataSource, request)),
        (b) => IO.fromEitherNow(b),
      ),
    ),
  );
}

/**
 * @tsplus pipeable fncts.query.Continue matchType
 */
export function matchType<R, E, A, B, C>(cases: { Effect: (query: Query<R, E, A>) => B; Get: (io: FIO<E, A>) => C }) {
  return (self: Continue<R, E, A>): B | C => {
    concrete(self);
    switch (self._tag) {
      case ContinueTag.Effect:
        return cases.Effect(self.query);
      case ContinueTag.Get:
        return cases.Get(self.io);
    }
  };
}

/**
 * @tsplus pipeable fncts.query.Continue mapQuery
 */
export function mapQuery<A, R1, E1, B>(f: (a: A) => Query<R1, E1, B>, __tsplusTrace?: string) {
  return <R, E>(self: Continue<R, E, A>): Continue<R | R1, E | E1, B> => {
    return self.matchType({
      Effect: (query) => Effect(query.flatMap(f)),
      Get: (io) => Effect(Query.fromIO(io).flatMap(f)),
    });
  };
}

/**
 * @tsplus pipeable fncts.query.Continue match
 */
export function match<E, A, B, C>(failure: (e: E) => B, success: (a: A) => C, __tsplusTrace?: string) {
  return <R>(self: Continue<R, E, A>): Continue<R, never, B | C> => {
    return self.matchType({
      Effect: (query) => Effect(query.match(failure, success)),
      Get: (io) => Get(io.match(failure, success)),
    });
  };
}

/**
 * @tsplus pipeable fncts.query.Continue matchCauseQuery
 */
export function matchCauseQuery<E, A, R1, E1, B, R2, E2, C>(
  failure: (cause: Cause<E>) => Query<R1, E1, B>,
  success: (value: A) => Query<R2, E2, C>,
  __tsplusTrace?: string,
) {
  return <R>(self: Continue<R, E, A>): Continue<R | R1 | R2, E1 | E2, B | C> => {
    return self.matchType({
      Effect: (query) => Effect(query.matchCauseQuery(failure, success)),
      Get: (io) => Effect(Query.fromIO(io).matchCauseQuery(failure, success)),
    });
  };
}

/**
 * @tsplus pipeable fncts.query.Continue map
 */
export function map<A, B>(f: (a: A) => B, __tsplusTrace?: string) {
  return <R, E>(self: Continue<R, E, A>): Continue<R, E, B> => {
    return self.matchType({
      Effect: (query) => Effect(query.map(f)),
      Get: (io) => Get(io.map(f)),
    });
  };
}

/**
 * @tsplus pipeable fncts.query.Continue mapDataSources
 */
export function mapDataSources<R1>(f: DataSourceAspect<R1>, __tsplusTrace?: string) {
  return <R, E, A>(self: Continue<R, E, A>): Continue<R | R1, E, A> => {
    return self.matchType({
      Effect: (query) => Effect(query.mapDataSources(f)),
      Get: (io) => Get(io),
    });
  };
}

/**
 * @tsplus pipeable fncts.query.Continue mapError
 */
export function mapError<E, E1>(f: (e: E) => E1, __tsplusTrace?: string) {
  return <R, A>(self: Continue<R, E, A>): Continue<R, E1, A> => {
    return self.matchType({
      Effect: (query) => Effect(query.mapError(f)),
      Get: (io) => Get(io.mapError(f)),
    });
  };
}

/**
 * @tsplus pipeable fncts.query.Continue mapErrorCause
 */
export function mapErrorCause<E, E1>(f: (cause: Cause<E>) => Cause<E1>, __tsplusTrace?: string) {
  return <R, A>(self: Continue<R, E, A>): Continue<R, E1, A> => {
    return self.matchType({
      Effect: (query) => Effect(query.mapErrorCause(f)),
      Get: (io) => Get(io.mapErrorCause(f)),
    });
  };
}

/**
 * @tsplus pipeable fncts.query.Continue zipWith
 */
export function zipWith<A, R1, E1, B, C>(that: Continue<R1, E1, B>, f: (a: A, b: B) => C, __tsplusTrace?: string) {
  return <R, E>(self: Continue<R, E, A>): Continue<R | R1, E | E1, C> => {
    return self.matchType({
      Effect: (l) =>
        that.matchType({
          Effect: (r) => Effect(l.zipWith(r, f)),
          Get: (r) => Effect(l.zipWith(Query.fromIO(r), f)),
        }),
      Get: (l) =>
        that.matchType({
          Effect: (r) => Effect(Query.fromIO(l).zipWith(r, f)),
          Get: (r) => Get(l.zipWith(r, f)),
        }),
    });
  };
}

/**
 * @tsplus pipeable fncts.query.Continue zipWithConcurrent
 */
export function zipWithConcurrent<A, R1, E1, B, C>(
  that: Continue<R1, E1, B>,
  f: (a: A, b: B) => C,
  __tsplusTrace?: string,
) {
  return <R, E>(self: Continue<R, E, A>): Continue<R | R1, E | E1, C> => {
    return self.matchType({
      Effect: (l) =>
        that.matchType({
          Effect: (r) => Effect(l.zipWithConcurrent(r, f)),
          Get: (r) => Effect(l.zipWith(Query.fromIO(r), f)),
        }),
      Get: (l) =>
        that.matchType({
          Effect: (r) => Effect(Query.fromIO(l).zipWith(r, f)),
          Get: (r) => Get(l.zipWith(r, f)),
        }),
    });
  };
}

/**
 * @tsplus pipeable fncts.query.Continue zipWithBatched
 */
export function zipWithBatched<A, R1, E1, B, C>(
  that: Continue<R1, E1, B>,
  f: (a: A, b: B) => C,
  __tsplusTrace?: string,
) {
  return <R, E>(self: Continue<R, E, A>): Continue<R | R1, E | E1, C> => {
    return self.matchType({
      Effect: (l) =>
        that.matchType({
          Effect: (r) => Effect(l.zipWithBatched(r, f)),
          Get: (r) => Effect(l.zipWith(Query.fromIO(r), f)),
        }),
      Get: (l) =>
        that.matchType({
          Effect: (r) => Effect(Query.fromIO(l).zipWith(r, f)),
          Get: (r) => Get(l.zipWith(r, f)),
        }),
    });
  };
}

/**
 * @tsplus static fncts.query.ContinueOps collectAllConcurrent
 */
export function collectAllConcurrent<R, E, A>(continues: Iterable<Continue<R, E, A>>): Continue<R, E, Conc<A>> {
  const [queries, ios] = continues.zipWithIndex.foldLeft(
    [Conc.empty<readonly [Query<R, E, A>, number]>(), Conc.empty<readonly [FIO<E, A>, number]>()] as const,
    ([queries, ios], [index, cont]) =>
      cont.matchType({
        Effect: (query) => [queries.append([query, index] as const), ios] as const,
        Get: (io) => [queries, ios.append([io, index] as const)] as const,
      }),
  );
  if (queries.length === 0) {
    return Continue.get(IO.sequenceIterable(ios.map(([io]) => io)));
  } else {
    const query = Query.collectAllConcurrent(queries.map(([query]) => query)).flatMap((as) => {
      const array = Array(continues.size);
      as.zip(queries.map(([_, index]) => index)).forEach(([a, i]) => {
        array[i] = a;
      });
      return Query.fromIO(IO.sequenceIterable(ios.map(([io]) => io))).map((as) => {
        as.zip(ios.map(([_, index]) => index)).forEach(([a, i]) => {
          array[i] = a;
        });
        return Conc.from(array);
      });
    });
    return Continue.effect(query);
  }
}

/**
 * @tsplus pipeable fncts.query.Continue contramapEnvironment
 */
export function contramapEnvironment<R0, R>(
  f: Described<(_: Environment<R0>) => Environment<R>>,
  __tsplusTrace?: string,
) {
  return <E, A>(self: Continue<R, E, A>): Continue<R0, E, A> => {
    return self.matchType({
      Effect: (query) => Continue.effect(query.contramapEnvironment(f)),
      Get: (io) => Continue.get(io),
    });
  };
}
