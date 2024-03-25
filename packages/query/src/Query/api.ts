import { Cache } from "@fncts/query/Cache";

/**
 * @tsplus static fncts.query.QueryOps cachingEnabled
 */
export const cachingEnabled: FiberRef<boolean> = FiberRef.unsafeMake(true);
/**
 * @tsplus static fncts.query.QueryOps currentCache
 */
export const currentCache: FiberRef<Cache> = FiberRef.unsafeMake(Cache.unsafeMake());

/**
 * @tsplus static fncts.query.QueryOps fromIO
 */
export function fromIO<R, E, A>(io: Lazy<IO<R, E, A>>): Query<R, E, A> {
  return new Query(IO.defer(io).matchCause(Result.fail, Result.done));
}

/**
 * @tsplus static fncts.query.QueryOps failCause
 */
export function failCause<E>(cause: Lazy<Cause<E>>, __tsplusTrace?: string): Query<never, E, never> {
  return new Query(IO.succeed(Result.fail(cause())));
}

/**
 * @tsplus static fncts.query.QueryOps failCauseNow
 */
export function failCauseNow<E>(cause: Cause<E>, __tsplusTrace?: string): Query<never, E, never> {
  return new Query(IO.succeedNow(Result.fail(cause)));
}

/**
 * @tsplus static fncts.query.QueryOps fail
 */
export function fail<E>(e: Lazy<E>, __tsplusTrace?: string): Query<never, E, never> {
  return Query.failCause(Cause.fail(e()));
}

/**
 * @tsplus static fncts.query.QueryOps failNow
 */
export function failNow<E>(e: E, __tsplusTrace?: string): Query<never, E, never> {
  return Query.failCauseNow(Cause.fail(e));
}

/**
 * @tsplus static fncts.query.QueryOps halt
 */
export function halt(t: Lazy<unknown>, __tsplusTrace?: string): Query<never, never, never> {
  return new Query(IO.halt(t));
}

/**
 * @tsplus static fncts.query.QueryOps haltNow
 */
export function haltNow(t: unknown, __tsplusTrace?: string): Query<never, never, never> {
  return new Query(IO.haltNow(t));
}

/**
 * @tsplus static fncts.query.QueryOps succeed
 */
export function succeed<A>(value: Lazy<A>): Query<never, never, A> {
  return new Query(IO.succeed(Result.done(value())));
}

/**
 * @tsplus static fncts.query.QueryOps succeedNow
 */
export function succeedNow<A>(value: A): Query<never, never, A> {
  return new Query(IO.succeedNow(Result.done(value)));
}

/**
 * @tsplus static fncts.query.QueryOps unit
 */
export const unit: Query<never, never, void> = Query.succeedNow(undefined);
