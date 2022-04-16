import { identity, tuple } from "../../data/function.js";
import {
  Chain,
  Defer,
  Environment,
  Fail,
  MapLog,
  Match,
  Modify,
  Provide,
  Succeed,
  SucceedNow,
  Tell,
} from "./definition.js";

/**
 * @tsplus getter fncts.control.Z absolve
 */
export function absolve<W, S1, S2, R, E, E1, A>(fa: Z<W, S1, S2, R, E, Either<E1, A>>): Z<W, S1, S2, R, E | E1, A> {
  return fa.flatMap((ea) => ea.match(Z.failNow, Z.succeedNow));
}

/**
 * @tsplus fluent fncts.control.Z ap
 */
export function ap_<W, S, R, E, A, R1, E1, B>(
  self: Z<W, S, S, R, E, (a: A) => B>,
  fb: Z<W, S, S, R1, E1, A>,
): Z<W, S, S, R & R1, E | E1, B> {
  return self.crossWith(fb, (f, a) => f(a));
}

/**
 * @tsplus fluent fncts.control.Z apFirst
 */
export function apFirst_<W, S, R, E, A, R1, E1, B>(
  fa: Z<W, S, S, R, E, A>,
  fb: Z<W, S, S, R1, E1, B>,
): Z<W, S, S, R & R1, E | E1, A> {
  return fa.crossWith(fb, (a, _) => a);
}

/**
 * @tsplus fluent fncts.control.Z apSecond
 */
export function apSecond_<W, S, R, E, A, R1, E1, B>(
  fa: Z<W, S, S, R, E, A>,
  fb: Z<W, S, S, R1, E1, B>,
): Z<W, S, S, R & R1, E | E1, B> {
  return fa.crossWith(fb, (_, b) => b);
}

/**
 * @tsplus fluent fncts.control.Z bimap
 */
export function bimap_<W, S1, S2, R, E, A, G, B>(
  pab: Z<W, S1, S2, R, E, A>,
  f: (e: E) => G,
  g: (a: A) => B,
): Z<W, S1, S2, R, G, B> {
  return pab.matchZ(
    (e) => Z.failNow(f(e)),
    (a) => Z.succeedNow(g(a)),
  );
}

/**
 * Recovers from all errors.
 *
 * @tsplus fluent fncts.control.Z catchAll
 */
export function catchAll_<W, S1, S2, R, E, A, S3, R1, E1, B>(
  fa: Z<W, S1, S2, R, E, A>,
  onFailure: (e: E) => Z<W, S1, S3, R1, E1, B>,
): Z<W, S1, S3, R & R1, E1, A | B> {
  return fa.matchZ(onFailure, Z.succeedNow);
}

/**
 * @tsplus fluent fncts.control.Z catchJust
 */
export function catchJust_<W, S1, S2, R, E, A, S3, R1, E1, B>(
  fa: Z<W, S1, S2, R, E, A>,
  f: (e: E) => Maybe<Z<W, S1, S3, R1, E1, B>>,
): Z<W, S1, S2 | S3, R & R1, E | E1, A | B> {
  return fa.catchAll((e) => f(e).getOrElse(fa));
}

/**
 * @tsplus fluent fncts.control.Z flatMap
 */
export function flatMap_<W, S1, S2, R, E, A, W1, S3, R1, E1, B>(
  ma: Z<W, S1, S2, R, E, A>,
  f: (a: A) => Z<W1, S2, S3, R1, E1, B>,
): Z<W | W1, S1, S3, R1 & R, E1 | E, B> {
  return new Chain(ma, f);
}

/**
 * @tsplus fluent fncts.control.Z contramapEnvironment
 */
export function contramapEnvironment_<R0, W, S1, S2, R, E, A>(
  ma: Z<W, S1, S2, R, E, A>,
  f: (r0: R0) => R,
): Z<W, S1, S2, R0, E, A> {
  return Z.environmentWithZ((r: R0) => ma.provideEnvironment(f(r)));
}

/**
 * Transforms the initial state of this computation` with the specified
 * function.
 *
 * @tsplus fluent fncts.control.Z contramapState
 */
export function contramapState_<S0, W, S1, S2, R, E, A>(
  fa: Z<W, S1, S2, R, E, A>,
  f: (s: S0) => S1,
): Z<W, S0, S2, R, E, A> {
  return Z.update(f).flatMap(() => fa);
}

/**
 * @tsplus fluent fncts.control.Z cross
 */
export function cross_<W, S, R, E, A, R1, E1, B>(
  fa: Z<W, S, S, R, E, A>,
  fb: Z<W, S, S, R1, E1, B>,
): Z<W, S, S, R & R1, E | E1, readonly [A, B]> {
  return fa.crossWith(fb, tuple);
}

/**
 * @tsplus fluent fncts.control.Z crossWith
 */
export function crossWith_<W, S, R, E, A, R1, E1, B, C>(
  fa: Z<W, S, S, R, E, A>,
  fb: Z<W, S, S, R1, E1, B>,
  f: (a: A, b: B) => C,
): Z<W, S, S, R & R1, E | E1, C> {
  return fa.flatMap((a) => fb.map((b) => f(a, b)));
}

/**
 * @tsplus static fncts.control.ZOps defer
 */
export function defer<W, S1, S2, R, E, A>(
  ma: Lazy<Z<W, S1, S2, R, E, A>>,
  __tsplusTrace?: string,
): Z<W, S1, S2, R, E, A> {
  return new Defer(ma);
}

/**
 * Returns a computation whose failure and success have been lifted into an
 * `Either`. The resulting computation cannot fail, because the failure case
 * has been exposed as part of the `Either` success case.
 *
 * @tsplus getter fncts.control.Z either
 */
export function either<W, S1, S2, R, E, A>(fa: Z<W, S1, S2, R, E, A>): Z<W, S1, S1 | S2, R, never, Either<E, A>> {
  return fa.match(Either.left, Either.right);
}

/**
 * @tsplus static fncts.control.ZOps environment
 */
export function environment<R>(): Z<never, unknown, never, R, never, R> {
  return new Environment((r: R) => Z.succeedNow(r));
}

/**
 * @tsplus static fncts.control.ZOps environmentWith
 */
export function environmentWith<R0, A>(f: (r: R0) => A): Z<never, unknown, never, R0, never, A> {
  return new Environment((r: R0) => succeed(f(r)));
}

/**
 * @tsplus static fncts.control.ZOps environmentWithZ
 */
export function environmentWithZ<R0, W, S1, S2, R, E, A>(
  f: (r: R0) => Z<W, S1, S2, R, E, A>,
): Z<W, S1, S2, R & R0, E, A> {
  return new Environment(f);
}

/**
 * Erases the current log
 *
 * @tsplus getter fncts.control.Z erase
 */
export function erase<W, S1, S2, R, E, A>(wa: Z<W, S1, S2, R, E, A>): Z<never, S1, S2, R, E, A> {
  return wa.mapLog(() => Conc.empty());
}

/**
 * @tsplus static fncts.control.ZOps fail
 */
export function fail<E>(e: Lazy<E>, __tsplusTrace?: string): Z<never, unknown, never, unknown, E, never> {
  return Z.failCause(Cause.fail(e()));
}

/**
 * @tsplus static fncts.control.ZOps failNow
 */
export function failNow<E>(e: E, __tsplusTrace?: string): Z<never, unknown, never, unknown, E, never> {
  return Z.failCauseNow(Cause.fail(e));
}

/**
 * @tsplus static fncts.control.ZOps failCause
 */
export function failCause<E>(
  cause: Lazy<Cause<E>>,
  __tsplusTrace?: string,
): Z<never, unknown, never, unknown, E, never> {
  return Z.defer(Z.failCauseNow(cause()));
}

/**
 * @tsplus static fncts.control.ZOps failCauseNow
 */
export function failCauseNow<E>(cause: Cause<E>, __tsplusTrace?: string): Z<never, unknown, never, unknown, E, never> {
  return new Fail(cause);
}

/**
 * @tsplus getter fncts.control.Z flatten
 */
export function flatten<W, S1, S2, R, E, A, W1, S3, R1, E1>(
  mma: Z<W, S1, S2, R, E, Z<W1, S2, S3, R1, E1, A>>,
): Z<W | W1, S1, S3, R1 & R, E1 | E, A> {
  return mma.flatMap(identity);
}

/**
 * Constructs a computation that returns the initial state unchanged.
 *
 * @tsplus static fncts.control.ZOps get
 */
export function get<S>(): Z<never, S, S, unknown, never, S> {
  return Z.modify((s) => [s, s]);
}

/**
 * @tsplus static fncts.control.ZOps gets
 */
export function gets<S, A>(f: (s: S) => A): Z<never, S, S, unknown, never, A> {
  return Z.modify((s) => [f(s), s]);
}

/**
 * @tsplus static fncts.control.ZOps getsZ
 */
export function getsZ<S, W, R, E, A>(f: (s: S) => Z<W, S, S, R, E, A>): Z<W, S, S, R, E, A> {
  return Z.get<S>().flatMap(f);
}

/**
 * @tsplus static fncts.control.ZOps halt
 */
export function halt(defect: Lazy<unknown>, __tsplusTrace?: string): Z<never, unknown, never, unknown, never, never> {
  return Z.failCause(Cause.halt(defect()));
}

/**
 * @tsplus static fncts.control.ZOps haltNow
 */
export function haltNow(defect: unknown, __tsplusTrace?: string): Z<never, unknown, never, unknown, never, never> {
  return Z.failCauseNow(Cause.halt(defect));
}

/**
 * @tsplus getter fncts.control.Z listen
 */
export function listen<W, S1, S2, R, E, A>(wa: Z<W, S1, S2, R, E, A>): Z<W, S1, S2, R, E, readonly [A, Conc<W>]> {
  return wa.matchLogCauseZ(
    (_, e) => Z.failCauseNow(e),
    (ws, a) => Z.succeedNow([a, ws]),
  );
}

/**
 * @tsplus fluent fncts.control.Z listens
 */
export function listens_<W, S1, S2, R, E, A, B>(
  wa: Z<W, S1, S2, R, E, A>,
  f: (log: Conc<W>) => B,
): Z<W, S1, S2, R, E, readonly [A, B]> {
  return wa.listen.map(([a, ws]) => [a, f(ws)]);
}

/**
 * @tsplus fluent fncts.control.Z map
 */
export function map_<W, S1, S2, R, E, A, B>(fa: Z<W, S1, S2, R, E, A>, f: (a: A) => B): Z<W, S1, S2, R, E, B> {
  return fa.flatMap((a) => Z.succeedNow(f(a)));
}

/**
 * @tsplus fluent fncts.control.Z mapError
 */
export function mapError_<W, S1, S2, R, E, A, G>(pab: Z<W, S1, S2, R, E, A>, f: (e: E) => G): Z<W, S1, S2, R, G, A> {
  return pab.matchZ((e) => Z.failNow(f(e)), Z.succeedNow);
}

/**
 * Modifies the current log with the specified function
 *
 * @tsplus fluent fncts.control.Z mapLog
 */
export function mapLog_<W, S1, S2, R, E, A, W1>(
  wa: Z<W, S1, S2, R, E, A>,
  f: (ws: Conc<W>) => Conc<W1>,
): Z<W1, S1, S2, R, E, A> {
  return new MapLog(wa, f);
}

/**
 * Modifies the current state with the specified function
 *
 * @tsplus fluent fncts.control.Z mapState
 */
export function mapState_<W, S1, S2, R, E, A, S3>(ma: Z<W, S1, S2, R, E, A>, f: (s: S2) => S3): Z<W, S1, S3, R, E, A> {
  return ma.transform((s, a) => [a, f(s)]);
}

/**
 * Folds over the failed or successful results of this computation to yield
 * a computation that does not fail, but succeeds with the value of the left
 * or right function passed to `match`.
 *
 * @tsplus fluent fncts.control.Z match
 */
export function match_<W, S1, S2, R, E, A, B, C>(
  fa: Z<W, S1, S2, R, E, A>,
  onFailure: (e: E) => B,
  onSuccess: (a: A) => C,
): Z<W, S1, S2, R, never, B | C> {
  return fa.matchZ(
    (e) => Z.succeedNow(onFailure(e)),
    (a) => Z.succeedNow(onSuccess(a)),
  );
}

/**
 * Recovers from errors by accepting one computation to execute for the case
 * of an error, and one computation to execute for the case of success.
 *
 * @tsplus fluent fncts.control.Z matchZ
 */
export function matchZ_<W, S1, S5, S2, R, E, A, W1, S3, R1, E1, B, W2, S4, R2, E2, C>(
  fa: Z<W, S1, S2, R, E, A>,
  onFailure: (e: E) => Z<W1, S5, S3, R1, E1, B>,
  onSuccess: (a: A) => Z<W2, S2, S4, R2, E2, C>,
): Z<W | W1 | W2, S1 & S5, S3 | S4, R & R1 & R2, E1 | E2, B | C> {
  return fa.matchCauseZ((cause) => cause.failureOrCause.match(onFailure, Z.failCauseNow), onSuccess);
}

/**
 * @tsplus fluent fncts.control.Z matchCauseZ
 */
export function matchCauseZ_<W, S1, S2, R, E, A, W1, S0, S3, R1, E1, B, W2, S4, R2, E2, C>(
  fa: Z<W, S1, S2, R, E, A>,
  onFailure: (e: Cause<E>) => Z<W1, S0, S3, R1, E1, B>,
  onSuccess: (a: A) => Z<W2, S2, S4, R2, E2, C>,
): Z<W | W1 | W2, S0 & S1, S3 | S4, R & R1 & R2, E1 | E2, B | C> {
  return matchLogCauseZ_(
    fa,
    (ws, e) => onFailure(e).mapLog((w1s) => ws.concat(w1s)),
    (ws, a) => onSuccess(a).mapLog((w2s) => ws.concat(w2s)),
  );
}

/**
 * @tsplus fluent fncts.control.Z matchLogZ
 */
export function matchLogZ_<W, S1, S5, S2, R, E, A, W1, S3, R1, E1, B, W2, S4, R2, E2, C>(
  fa: Z<W, S1, S2, R, E, A>,
  onFailure: (ws: Conc<W>, e: E) => Z<W1, S5, S3, R1, E1, B>,
  onSuccess: (ws: Conc<W>, a: A) => Z<W2, S2, S4, R2, E2, C>,
): Z<W | W1 | W2, S1 & S5, S3 | S4, R & R1 & R2, E1 | E2, B | C> {
  return matchLogCauseZ_(
    fa,
    (ws, cause) => cause.failureOrCause.match((e) => onFailure(ws, e), Z.failCauseNow),
    onSuccess,
  );
}

/**
 * Recovers from errors by accepting one computation to execute for the case
 * of an error, and one computation to execute for the case of success. More powerful
 * than `matchCauseM` by providing the current state of the log as an argument in
 * each case
 *
 * @note the log is cleared after being provided
 *
 * @tsplus fluent fncts.control.Z matchLogCauseZ
 */
export function matchLogCauseZ_<W, S1, S2, R, E, A, W1, S0, S3, R1, E1, B, W2, S4, R2, E2, C>(
  fa: Z<W, S1, S2, R, E, A>,
  onFailure: (ws: Conc<W>, e: Cause<E>) => Z<W1, S0, S3, R1, E1, B>,
  onSuccess: (ws: Conc<W>, a: A) => Z<W2, S2, S4, R2, E2, C>,
): Z<W1 | W2, S0 & S1, S3 | S4, R & R1 & R2, E1 | E2, B | C> {
  return new Match(fa, onFailure, onSuccess);
}

/**
 * Constructs a computation from the specified modify function
 *
 * @tsplus static fncts.control.ZOps modify
 */
export function modify<S1, S2, A>(f: (s: S1) => readonly [A, S2]): Z<never, S1, S2, unknown, never, A> {
  return new Modify(f);
}

/**
 * Constructs a computation that may fail from the specified modify function.
 *
 * @tsplus static fncts.control.ZOps modifyEither
 */
export function modifyEither<S1, S2, E, A>(f: (s: S1) => Either<E, readonly [A, S2]>): Z<never, S1, S2, unknown, E, A> {
  return Z.get<S1>()
    .map(f)
    .flatMap((r) => r.match(Z.failNow, ([a, s2]) => Z.succeedNow(a).mapState(() => s2)));
}

/**
 * @tsplus fluent fncts.control.Z orElse
 */
export function orElse_<W, S1, S2, R, E, A, W1, S3, R1, E1, A1>(
  fa: Z<W, S1, S2, R, E, A>,
  fb: Lazy<Z<W1, S1, S3, R1, E1, A1>>,
): Z<W | W1, S1, S2 | S3, R & R1, E | E1, A | A1> {
  return fa.matchZ(() => fb(), Z.succeedNow);
}

/**
 * Executes this computation and returns its value, if it succeeds, but
 * otherwise executes the specified computation.
 *
 * @tsplus fluent fncts.control.Z orElseEither
 */
export function orElseEither_<W, S1, S2, R, E, A, S3, S4, R1, E1, A1>(
  fa: Z<W, S1, S2, R, E, A>,
  that: Lazy<Z<W, S3, S4, R1, E1, A1>>,
): Z<W, S1 & S3, S2 | S4, R & R1, E1, Either<A, A1>> {
  return fa.matchZ(
    () => that().map(Either.right),
    (a) => Z.succeedNow(Either.left(a)),
  );
}

/**
 * @tsplus fluent fncts.control.Z provideEnvironment
 */
export function provideEnvironment_<W, S1, S2, R, E, A>(fa: Z<W, S1, S2, R, E, A>, r: R): Z<W, S1, S2, unknown, E, A> {
  return new Provide(fa, r);
}

/**
 * Constructs a computation that sets the state to the specified value.
 *
 * @tsplus static fncts.control.ZOps put
 */
export function put<S>(s: S): Z<never, unknown, S, unknown, never, void> {
  return Z.modify(() => [undefined, s]);
}

/**
 * Repeats this computation the specified number of times (or until the first failure)
 * passing the updated state to each successive repetition.
 *
 * @tsplus fluent fncts.control.Z repeatN
 */
export function repeatN_<W, S1, S2 extends S1, R, E, A>(ma: Z<W, S1, S2, R, E, A>, n: number): Z<W, S1, S2, R, E, A> {
  return ma.flatMap((a) => (n <= 0 ? Z.succeedNow(a) : ma.repeatN(n - 1)));
}

/**
 * Repeats this computation until its value satisfies the specified predicate
 * (or until the first failure) passing the updated state to each successive repetition.
 *
 * @tsplus fluent fncts.control.Z repeatUntil
 */
export function repeatUntil_<W, S1, S2 extends S1, R, E, A>(
  ma: Z<W, S1, S2, R, E, A>,
  p: Predicate<A>,
): Z<W, S1, S2, R, E, A> {
  return ma.flatMap((a) => (p(a) ? Z.succeedNow(a) : ma.repeatUntil(p)));
}

/**
 * @tsplus static fncts.control.ZOps succeed
 */
export function succeed<A, W = never, S1 = unknown, S2 = never>(
  effect: Lazy<A>,
  __tsplusTrace?: string,
): Z<W, S1, S2, unknown, never, A> {
  return new Succeed(effect);
}

/**
 * @tsplus static fncts.control.ZOps succeedNow
 */
export function succeedNow<A, W = never, S1 = unknown, S2 = never>(
  a: A,
  __tsplusTrace?: string,
): Z<W, S1, S2, unknown, never, A> {
  return new SucceedNow(a);
}

/**
 * @tsplus fluent fncts.control.Z tap
 */
export function tap_<W, S1, S2, R, E, A, W1, S3, R1, E1, B>(
  ma: Z<W, S1, S2, R, E, A>,
  f: (a: A) => Z<W1, S2, S3, R1, E1, B>,
): Z<W | W1, S1, S3, R1 & R, E1 | E, A> {
  return ma.flatMap((a) => f(a).map(() => a));
}

/**
 * @tsplus static fncts.control.ZOps tell
 */
export function tell<W>(w: W): Z<W, unknown, never, unknown, never, void> {
  return Z.tellAll(Conc.single(w));
}

/**
 * @tsplus static fncts.control.ZOps tellAll
 */
export function tellAll<W>(ws: Conc<W>): Z<W, unknown, never, unknown, never, void> {
  return new Tell(ws);
}

/**
 * Like `map`, but also allows the state to be modified.
 *
 * @tsplus fluent fncts.control.Z transform
 */
export function transform_<W, S1, S2, R, E, A, S3, B>(
  ma: Z<W, S1, S2, R, E, A>,
  f: (s: S2, a: A) => readonly [B, S3],
): Z<W, S1, S3, R, E, B> {
  return ma.flatMap((a) => Z.modify((s) => f(s, a)));
}

/**
 * @tsplus static fncts.control.ZOps unit
 */
export const unit: Z<never, unknown, never, unknown, never, void> = Z.succeedNow(undefined);

/**
 * Constructs a computation from the specified update function.
 *
 * @tsplus static fncts.control.ZOps update
 */
export function update<S1, S2>(f: (s: S1) => S2): Z<never, S1, S2, unknown, never, void> {
  return Z.modify((s) => [undefined, f(s)]);
}

/**
 * @tsplus fluent fncts.control.Z write
 */
export function write_<W, S1, S2, R, E, A, W1>(ma: Z<W, S1, S2, R, E, A>, w: W1): Z<W | W1, S1, S2, R, E, A> {
  return ma.writeAll(Conc.single(w));
}

/**
 * @tsplus fluent fncts.control.Z writeAll
 */
export function writeAll_<W, S1, S2, R, E, A, W1>(
  ma: Z<W, S1, S2, R, E, A>,
  log: Conc<W1>,
): Z<W | W1, S1, S2, R, E, A> {
  return ma.mapLog((ws) => ws.concat(log));
}

/**
 * @tsplus fluent fncts.control.Z zip
 */
export function zip_<W, S1, S2, R, E, A, W1, S3, Q, D, B>(
  fa: Z<W, S1, S2, R, E, A>,
  fb: Z<W1, S2, S3, Q, D, B>,
): Z<W | W1, S1, S3, Q & R, D | E, readonly [A, B]> {
  return fa.zipWith(fb, tuple);
}

/**
 * @tsplus fluent fncts.control.Z zipFirst
 */
export function zipFirst_<W, S1, S2, R, E, A, W1, S3, Q, D, B>(
  fa: Z<W, S1, S2, R, E, A>,
  fb: Z<W1, S2, S3, Q, D, B>,
): Z<W | W1, S1, S3, Q & R, D | E, A> {
  return fa.zipWith(fb, (a, _) => a);
}

/**
 * @tsplus fluent fncts.control.Z zipSecond
 */
export function zipSecond_<W, S1, S2, R, E, A, W1, S3, Q, D, B>(
  fa: Z<W, S1, S2, R, E, A>,
  fb: Z<W1, S2, S3, Q, D, B>,
): Z<W | W1, S1, S3, Q & R, D | E, B> {
  return fa.zipWith(fb, (_, b) => b);
}

/**
 * @tsplus fluent fncts.control.Z zipWith
 */
export function zipWith_<W, S1, S2, R, E, A, W1, S3, R1, E1, B, C>(
  fa: Z<W, S1, S2, R, E, A>,
  fb: Z<W1, S2, S3, R1, E1, B>,
  f: (a: A, b: B) => C,
): Z<W | W1, S1, S3, R1 & R, E1 | E, C> {
  return fa.flatMap((a) => fb.map((b) => f(a, b)));
}
