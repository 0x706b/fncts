import type { Described } from "@fncts/query/Described";

import { BlockedRequests } from "@fncts/query/internal/BlockedRequests";

export const ResultTypeId = Symbol.for("fncts.query.Result");
export type ResultTypeId = typeof ResultTypeId;

export const ResultVariance = Symbol.for("fncts.query.Result.Variance");
export type ResultVariance = typeof ResultVariance;

/**
 * @tsplus type fncts.query.Result
 * @tsplus companion fncts.query.ResultOps
 */
export abstract class Result<R, E, A> {
  readonly [ResultTypeId]: ResultTypeId = ResultTypeId;
  declare [ResultVariance]: {
    readonly _R: (_: never) => R;
    readonly _E: (_: never) => E;
    readonly _A: (_: never) => A;
  };
}

export const enum ResultTag {
  Blocked,
  Done,
  Fail,
}

export class Blocked<R, E, A> extends Result<R, E, A> {
  readonly _tag = ResultTag.Blocked;
  constructor(
    readonly blockedRequests: BlockedRequests<R>,
    readonly cont: Continue<R, E, A>,
  ) {
    super();
  }
}

export class Done<A> extends Result<never, never, A> {
  readonly _tag = ResultTag.Done;
  constructor(readonly value: A) {
    super();
  }
}

export class Fail<E> extends Result<never, E, never> {
  readonly _tag = ResultTag.Fail;
  constructor(readonly cause: Cause<E>) {
    super();
  }
}

type Concrete<R, E, A> = Blocked<R, E, A> | Done<A> | Fail<E>;

function concrete<R, E, A>(_: Result<R, E, A>): asserts _ is Concrete<R, E, A> {
  //
}

/**
 * @tsplus static fncts.query.ResultOps blocked
 */
export function blocked<R, E, A>(blockedRequests: BlockedRequests<R>, cont: Continue<R, E, A>): Result<R, E, A> {
  return new Blocked(blockedRequests, cont);
}

/**
 * @tsplus static fncts.query.ResultOps done
 */
export function done<A>(value: A): Result<never, never, A> {
  return new Done(value);
}

/**
 * @tsplus static fncts.query.ResultOps fail
 */
export function fail<E>(cause: Cause<E>): Result<never, E, never> {
  return new Fail(cause);
}

/**
 * @tsplus pipeable fncts.query.Result matchType
 */
export function matchType<R, E, A, B, C, D>(cases: {
  Blocked: (blockedRequests: BlockedRequests<R>, cont: Continue<R, E, A>) => B;
  Done: (value: A) => C;
  Fail: (cause: Cause<E>) => D;
}) {
  return (self: Result<R, E, A>): B | C | D => {
    concrete(self);
    switch (self._tag) {
      case ResultTag.Blocked: {
        return cases.Blocked(self.blockedRequests, self.cont);
      }
      case ResultTag.Done: {
        return cases.Done(self.value);
      }
      case ResultTag.Fail: {
        return cases.Fail(self.cause);
      }
    }
  };
}

/**
 * @tsplus pipeable fncts.query.Result match
 */
export function match<E, A, B, C>(failure: (e: E) => B, success: (a: A) => C) {
  return <R>(self: Result<R, E, A>): Result<R, never, B | C> => {
    return self.matchType({
      Blocked: (br, c) => Result.blocked(br, c.match(failure, success)),
      Done: (a) => Result.done(success(a)),
      Fail: (e) => e.failureOrCause.match((e) => Result.done(failure(e)), Result.fail),
    });
  };
}

/**
 * @tsplus pipeable fncts.query.Result map
 */
export function map<A, B>(f: (a: A) => B, __tsplusTrace?: string) {
  return <R, E>(self: Result<R, E, A>): Result<R, E, B> => {
    return self.matchType({
      Blocked: (br, c) => Result.blocked(br, c.map(f)),
      Done: (a) => Result.done(f(a)),
      Fail: (cause) => Result.fail(cause),
    });
  };
}

/**
 * @tsplus pipeable fncts.query.Result mapDataSources
 */
export function mapDataSources<R1>(f: DataSourceAspect<R1>) {
  return <R, E, A>(self: Result<R, E, A>): Result<R | R1, E, A> => {
    return self.matchType({
      Blocked: (br, c) => Result.blocked(br.mapDataSources(f), c.mapDataSources(f)),
      Done: (a) => Result.done(a),
      Fail: (cause) => Result.fail(cause),
    });
  };
}

/**
 * @tsplus pipeable fncts.query.Result mapError
 */
export function mapError<E, E1>(f: (e: E) => E1, __tsplusTrace?: string) {
  return <R, A>(self: Result<R, E, A>): Result<R, E1, A> => {
    return self.matchType({
      Blocked: (br, c) => Result.blocked(br, c.mapError(f)),
      Done: Result.done,
      Fail: (cause) => Result.fail(cause.map(f)),
    });
  };
}

/**
 * @tsplus pipeable fncts.query.Result mapErrorCause
 */
export function mapErrorCause<E, E1>(f: (cause: Cause<E>) => Cause<E1>, __tsplusTrace?: string) {
  return <R, A>(self: Result<R, E, A>): Result<R, E1, A> => {
    return self.matchType({
      Blocked: (br, c) => Result.blocked(br, c.mapErrorCause(f)),
      Done: Result.done,
      Fail: (cause) => Result.fail(f(cause)),
    });
  };
}

/**
 * @tsplus static fncts.query.ResultOps collectAllConcurrent
 */
export function collectAllConcurrent<R, E, A>(
  self: Iterable<Result<R, E, A>>,
  __tsplusTrace?: string,
): Result<R, E, Conc<A>> {
  const [blocked, done, fails] = self.zipWithIndex.foldLeft(
    [
      Conc.empty<readonly [BlockedRequests<R>, Continue<R, E, A>, number]>(),
      Conc.empty<readonly [A, number]>(),
      Conc.empty<readonly [Cause<E>, number]>(),
    ] as const,
    ([blocked, done, fails], [index, result]) =>
      result.matchType({
        Blocked: (br, c) => [blocked.append([br, c, index] as const), done, fails] as const,
        Done: (a) => [blocked, done.append([a, index] as const), fails] as const,
        Fail: (e) => [blocked, done, fails.append([e, index] as const)] as const,
      }),
  );

  if (blocked.isEmpty && fails.isEmpty) {
    return Result.done(done.map(([a]) => a));
  } else if (fails.isEmpty) {
    const blockedRequests = blocked
      .map(([br]) => br)
      .foldLeft(BlockedRequests.empty<R>(), (b, a) => BlockedRequests.both(b, a));

    const cont = Continue.collectAllConcurrent(blocked.map(([_, cont]) => cont)).map((as) => {
      const array = Array(as.length);
      as.zip(blocked.map(([cont]) => cont)).forEachWithIndex((i, a) => {
        array[i] = a;
      });
      done.forEachWithIndex((i, a) => {
        array[i] = a;
      });
      return Conc.from(array);
    });
    return Result.blocked<R, E, Conc<A>>(blockedRequests, cont);
  } else {
    return Result.fail(fails.map(([cause]) => cause).foldLeft(Cause.empty(), (b, a) => Cause.parallel(b, a)));
  }
}

/**
 * @tsplus pipeable fncts.query.Result contramapEnvironment
 */
export function contramapEnvironment<R0, R>(
  f: Described<(_: Environment<R0>) => Environment<R>>,
  __tsplusTrace?: string,
) {
  return <E, A>(self: Result<R, E, A>): Result<R0, E, A> => {
    return self.matchType({
      Blocked: (br, cont) => Result.blocked(br.contramapEnvironment(f), cont.contramapEnvironment(f)),
      Done: (a) => Result.done(a),
      Fail: (e) => Result.fail(e),
    });
  };
}

/**
 * @tsplus static fncts.query.ResultOps fromEither
 */
export function fromEither<E, A>(either: Either<E, A>): Result<never, E, A> {
  return either.match(
    (e) => Result.fail(Cause.fail(e)),
    (a) => Result.done(a),
  );
}

/**
 * @tsplus static fncts.query.ResultOps fromExit
 */
export function fromExit<E, A>(exit: Exit<E, A>): Result<never, E, A> {
  return exit.match(Result.fail, Result.done);
}
