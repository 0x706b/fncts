import { ZPrimitive, ZTag } from "@fncts/base/control/Z/definition";

import { identity, tuple } from "../../data/function.js";

/**
 * @tsplus getter fncts.control.Z absolve
 */
export function absolve<W, S1, S2, R, E, E1, A>(fa: Z<W, S1, S2, R, E, Either<E1, A>>): Z<W, S1, S2, R, E | E1, A> {
  return fa.flatMap((ea) => ea.match(Z.failNow, Z.succeedNow));
}

/**
 * @tsplus pipeable fncts.control.Z ap
 */
export function ap<W, S, A, R1, E1>(fb: Z<W, S, S, R1, E1, A>) {
  return <R, E, B>(self: Z<W, S, S, R, E, (a: A) => B>): Z<W, S, S, R & R1, E | E1, B> => {
    return self.crossWith(fb, (f, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.control.Z zipLeft
 */
export function zipLeft<W, S, R1, E1, B>(fb: Z<W, S, S, R1, E1, B>) {
  return <R, E, A>(fa: Z<W, S, S, R, E, A>): Z<W, S, S, R & R1, E | E1, A> => {
    return fa.crossWith(fb, (a, _) => a);
  };
}

/**
 * @tsplus pipeable fncts.control.Z zipRight
 */
export function zipRight<W, S, R1, E1, B>(fb: Z<W, S, S, R1, E1, B>) {
  return <R, E, A>(fa: Z<W, S, S, R, E, A>): Z<W, S, S, R & R1, E | E1, B> => {
    return fa.crossWith(fb, (_, b) => b);
  };
}

/**
 * @tsplus pipeable fncts.control.Z bimap
 */
export function bimap<E, A, G, B>(f: (e: E) => G, g: (a: A) => B) {
  return <W, S1, S2, R>(pab: Z<W, S1, S2, R, E, A>): Z<W, S1, S2, R, G, B> => {
    return pab.matchZ(
      (e) => Z.failNow(f(e)),
      (a) => Z.succeedNow(g(a)),
    );
  };
}

/**
 * Recovers from all errors.
 *
 * @tsplus pipeable fncts.control.Z catchAll
 */
export function catchAll<W, S1, E, S3, R1, E1, B>(onFailure: (e: E) => Z<W, S1, S3, R1, E1, B>) {
  return <S2, R, A>(fa: Z<W, S1, S2, R, E, A>): Z<W, S1, S3, R | R1, E1, A | B> => {
    return fa.matchZ(onFailure, Z.succeedNow);
  };
}

/**
 * @tsplus pipeable fncts.control.Z catchJust
 */
export function catchJust<W, S1, E, S3, R1, E1, B>(f: (e: E) => Maybe<Z<W, S1, S3, R1, E1, B>>) {
  return <S2, R, A>(fa: Z<W, S1, S2, R, E, A>): Z<W, S1, S2 | S3, R | R1, E | E1, A | B> => {
    return fa.catchAll((e) => f(e).getOrElse(fa));
  };
}

/**
 * @tsplus pipeable fncts.control.Z flatMap
 */
export function flatMap<S2, A, W1, S3, R1, E1, B>(f: (a: A) => Z<W1, S2, S3, R1, E1, B>) {
  return <W, S1, R, E>(ma: Z<W, S1, S2, R, E, A>): Z<W | W1, S1, S3, R1 & R, E1 | E, B> => {
    const z = new ZPrimitive(ZTag.Chain) as any;
    z.i0    = ma;
    z.i1    = f;
    return z;
  };
}

/**
 * @tsplus pipeable fncts.control.Z contramapEnvironment
 */
export function contramapEnvironment<R0, R>(f: (r0: Environment<R0>) => Environment<R>) {
  return <W, S1, S2, E, A>(ma: Z<W, S1, S2, R, E, A>): Z<W, S1, S2, R0, E, A> => {
    return Z.environmentWithZ((r) => ma.provideEnvironment(f(r)));
  };
}

/**
 * Transforms the initial state of this computation` with the specified
 * function.
 *
 * @tsplus pipeable fncts.control.Z contramapState
 */
export function contramapState<S0, S1>(f: (s: S0) => S1) {
  return <W, S2, R, E, A>(fa: Z<W, S1, S2, R, E, A>): Z<W, S0, S2, R, E, A> => {
    return Z.update(f).flatMap(() => fa);
  };
}

/**
 * @tsplus pipeable fncts.control.Z cross
 */
export function cross<W, S, R1, E1, B>(fb: Z<W, S, S, R1, E1, B>) {
  return <R, E, A>(fa: Z<W, S, S, R, E, A>): Z<W, S, S, R & R1, E | E1, readonly [A, B]> => {
    return fa.crossWith(fb, tuple);
  };
}

/**
 * @tsplus pipeable fncts.control.Z crossWith
 */
export function crossWith<W, S, A, R1, E1, B, C>(fb: Z<W, S, S, R1, E1, B>, f: (a: A, b: B) => C) {
  return <R, E>(fa: Z<W, S, S, R, E, A>): Z<W, S, S, R & R1, E | E1, C> => {
    return fa.flatMap((a) => fb.map((b) => f(a, b)));
  };
}

/**
 * @tsplus static fncts.control.ZOps defer
 */
export function defer<W, S1, S2, R, E, A>(
  ma: Lazy<Z<W, S1, S2, R, E, A>>,
  __tsplusTrace?: string,
): Z<W, S1, S2, R, E, A> {
  const z = new ZPrimitive(ZTag.Defer) as any;
  z.i0    = ma;
  return z;
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
export function environment<R>(): Z<never, unknown, never, R, never, Environment<R>> {
  const z = new ZPrimitive(ZTag.Access) as any;
  z.i0    = (r: any) => Z.succeedNow(r);
  return z;
}

/**
 * @tsplus static fncts.control.ZOps environmentWith
 */
export function environmentWith<R0, A>(f: (r: Environment<R0>) => A): Z<never, unknown, never, R0, never, A> {
  const z = new ZPrimitive(ZTag.Access) as any;
  z.i0    = (r: any) => Z.succeedNow(f(r));
  return z;
}

/**
 * @tsplus static fncts.control.ZOps environmentWithZ
 */
export function environmentWithZ<R0, W, S1, S2, R, E, A>(
  f: (r: Environment<R0>) => Z<W, S1, S2, R, E, A>,
): Z<W, S1, S2, R | R0, E, A> {
  const z = new ZPrimitive(ZTag.Access) as any;
  z.i0    = f;
  return z;
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
export function fail<E>(e: Lazy<E>, __tsplusTrace?: string): Z<never, unknown, never, never, E, never> {
  return Z.failCause(Cause.fail(e()));
}

/**
 * @tsplus static fncts.control.ZOps failNow
 */
export function failNow<E>(e: E, __tsplusTrace?: string): Z<never, unknown, never, never, E, never> {
  return Z.failCauseNow(Cause.fail(e));
}

/**
 * @tsplus static fncts.control.ZOps failCause
 */
export function failCause<E>(cause: Lazy<Cause<E>>, __tsplusTrace?: string): Z<never, unknown, never, never, E, never> {
  return Z.defer(Z.failCauseNow(cause()));
}

/**
 * @tsplus static fncts.control.ZOps failCauseNow
 */
export function failCauseNow<E>(cause: Cause<E>, __tsplusTrace?: string): Z<never, unknown, never, never, E, never> {
  const z = new ZPrimitive(ZTag.Fail) as any;
  z.i0    = cause;
  return z;
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
export function get<S>(): Z<never, S, S, never, never, S> {
  return Z.modify((s) => [s, s]);
}

/**
 * @tsplus static fncts.control.ZOps gets
 */
export function gets<S, A>(f: (s: S) => A): Z<never, S, S, never, never, A> {
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
export function halt(defect: Lazy<unknown>, __tsplusTrace?: string): Z<never, unknown, never, never, never, never> {
  return Z.failCause(Cause.halt(defect()));
}

/**
 * @tsplus static fncts.control.ZOps haltNow
 */
export function haltNow(defect: unknown, __tsplusTrace?: string): Z<never, unknown, never, never, never, never> {
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
 * @tsplus pipeable fncts.control.Z listens
 */
export function listens<W, B>(f: (log: Conc<W>) => B) {
  return <S1, S2, R, E, A>(wa: Z<W, S1, S2, R, E, A>): Z<W, S1, S2, R, E, readonly [A, B]> => {
    return wa.listen.map(([a, ws]) => [a, f(ws)]);
  };
}

/**
 * @tsplus pipeable fncts.control.Z map
 */
export function map<A, B>(f: (a: A) => B) {
  return <W, S1, S2, R, E>(fa: Z<W, S1, S2, R, E, A>): Z<W, S1, S2, R, E, B> => {
    return fa.flatMap((a) => Z.succeedNow(f(a)));
  };
}

/**
 * @tsplus pipeable fncts.control.Z mapError
 */
export function mapError<E, G>(f: (e: E) => G) {
  return <W, S1, S2, R, A>(pab: Z<W, S1, S2, R, E, A>): Z<W, S1, S2, R, G, A> => {
    return pab.matchZ((e) => Z.failNow(f(e)), Z.succeedNow);
  };
}

/**
 * Modifies the current log with the specified function
 *
 * @tsplus pipeable fncts.control.Z mapLog
 */
export function mapLog<W, W1>(f: (ws: Conc<W>) => Conc<W1>) {
  return <S1, S2, R, E, A>(wa: Z<W, S1, S2, R, E, A>): Z<W1, S1, S2, R, E, A> => {
    const z = new ZPrimitive(ZTag.MapLog) as any;
    z.i0    = wa;
    z.i1    = f;
    return z;
  };
}

/**
 * Modifies the current state with the specified function
 *
 * @tsplus pipeable fncts.control.Z mapState
 */
export function mapState<S2, S3>(f: (s: S2) => S3) {
  return <W, S1, R, E, A>(ma: Z<W, S1, S2, R, E, A>): Z<W, S1, S3, R, E, A> => {
    return ma.transform((s, a) => [a, f(s)]);
  };
}

/**
 * Folds over the failed or successful results of this computation to yield
 * a computation that does not fail, but succeeds with the value of the left
 * or right function passed to `match`.
 *
 * @tsplus pipeable fncts.control.Z match
 */
export function match<E, A, B, C>(onFailure: (e: E) => B, onSuccess: (a: A) => C) {
  return <W, S1, S2, R>(fa: Z<W, S1, S2, R, E, A>): Z<W, S1, S2, R, never, B | C> => {
    return fa.matchZ(
      (e) => Z.succeedNow(onFailure(e)),
      (a) => Z.succeedNow(onSuccess(a)),
    );
  };
}

/**
 * Recovers from errors by accepting one computation to execute for the case
 * of an error, and one computation to execute for the case of success.
 *
 * @tsplus pipeable fncts.control.Z matchZ
 */
export function matchZ<S5, S2, E, A, W1, S3, R1, E1, B, W2, S4, R2, E2, C>(
  onFailure: (e: E) => Z<W1, S5, S3, R1, E1, B>,
  onSuccess: (a: A) => Z<W2, S2, S4, R2, E2, C>,
) {
  return <W, S1, R>(fa: Z<W, S1, S2, R, E, A>): Z<W | W1 | W2, S1 & S5, S3 | S4, R | R1 | R2, E1 | E2, B | C> => {
    return fa.matchCauseZ((cause) => cause.failureOrCause.match(onFailure, Z.failCauseNow), onSuccess);
  };
}

/**
 * @tsplus pipeable fncts.control.Z matchCauseZ
 */
export function matchCauseZ<S2, E, A, W1, S0, S3, R1, E1, B, W2, S4, R2, E2, C>(
  onFailure: (e: Cause<E>) => Z<W1, S0, S3, R1, E1, B>,
  onSuccess: (a: A) => Z<W2, S2, S4, R2, E2, C>,
) {
  return <W, S1, R>(fa: Z<W, S1, S2, R, E, A>): Z<W | W1 | W2, S0 & S1, S3 | S4, R | R1 | R2, E1 | E2, B | C> => {
    return fa.matchLogCauseZ(
      (ws, e) => onFailure(e).mapLog((w1s) => ws.concat(w1s)),
      (ws, a) => onSuccess(a).mapLog((w2s) => ws.concat(w2s)),
    );
  };
}

/**
 * @tsplus pipeable fncts.control.Z matchLogZ
 */
export function matchLogZ<W, S5, S2, E, A, W1, S3, R1, E1, B, W2, S4, R2, E2, C>(
  onFailure: (ws: Conc<W>, e: E) => Z<W1, S5, S3, R1, E1, B>,
  onSuccess: (ws: Conc<W>, a: A) => Z<W2, S2, S4, R2, E2, C>,
) {
  return <S1, R>(fa: Z<W, S1, S2, R, E, A>): Z<W | W1 | W2, S1 & S5, S3 | S4, R | R1 | R2, E1 | E2, B | C> => {
    return fa.matchLogCauseZ(
      (ws, cause) => cause.failureOrCause.match((e) => onFailure(ws, e), Z.failCauseNow),
      onSuccess,
    );
  };
}

/**
 * Recovers from errors by accepting one computation to execute for the case
 * of an error, and one computation to execute for the case of success. More powerful
 * than `matchCauseM` by providing the current state of the log as an argument in
 * each case
 *
 * @note the log is cleared after being provided
 *
 * @tsplus pipeable fncts.control.Z matchLogCauseZ
 */
export function matchLogCauseZ<W, S2, E, A, W1, S0, S3, R1, E1, B, W2, S4, R2, E2, C>(
  onFailure: (ws: Conc<W>, e: Cause<E>) => Z<W1, S0, S3, R1, E1, B>,
  onSuccess: (ws: Conc<W>, a: A) => Z<W2, S2, S4, R2, E2, C>,
) {
  return <S1, R>(fa: Z<W, S1, S2, R, E, A>): Z<W1 | W2, S0 & S1, S3 | S4, R & R1 & R2, E1 | E2, B | C> => {
    const z = new ZPrimitive(ZTag.Match) as any;
    z.i0    = fa;
    z.i1    = onFailure;
    z.i2    = onSuccess;
    return z;
  };
}

/**
 * Constructs a computation from the specified modify function
 *
 * @tsplus static fncts.control.ZOps modify
 */
export function modify<S1, S2, A>(f: (s: S1) => readonly [A, S2]): Z<never, S1, S2, never, never, A> {
  const z = new ZPrimitive(ZTag.Modify) as any;
  z.i0    = f;
  return z;
}

/**
 * Constructs a computation that may fail from the specified modify function.
 *
 * @tsplus static fncts.control.ZOps modifyEither
 */
export function modifyEither<S1, S2, E, A>(f: (s: S1) => Either<E, readonly [A, S2]>): Z<never, S1, S2, never, E, A> {
  return Z.get<S1>()
    .map(f)
    .flatMap((r) => r.match(Z.failNow, ([a, s2]) => Z.succeedNow(a).mapState(() => s2)));
}

/**
 * @tsplus pipeable fncts.control.Z orElse
 */
export function orElse<S1, W1, S3, R1, E1, A1>(fb: Lazy<Z<W1, S1, S3, R1, E1, A1>>) {
  return <W, S2, R, E, A>(fa: Z<W, S1, S2, R, E, A>): Z<W | W1, S1, S2 | S3, R | R1, E | E1, A | A1> => {
    return fa.matchZ(() => fb(), Z.succeedNow);
  };
}

/**
 * Executes this computation and returns its value, if it succeeds, but
 * otherwise executes the specified computation.
 *
 * @tsplus pipeable fncts.control.Z orElseEither
 */
export function orElseEither<W, S3, S4, R1, E1, A1>(that: Lazy<Z<W, S3, S4, R1, E1, A1>>) {
  return <S1, S2, R, E, A>(fa: Z<W, S1, S2, R, E, A>): Z<W, S1 & S3, S2 | S4, R | R1, E1, Either<A, A1>> => {
    return fa.matchZ(
      () => that().map(Either.right),
      (a) => Z.succeedNow(Either.left(a)),
    );
  };
}

/**
 * @tsplus pipeable fncts.control.Z provideEnvironment
 */
export function provideEnvironment<R>(r: Environment<R>) {
  return <W, S1, S2, E, A>(fa: Z<W, S1, S2, R, E, A>): Z<W, S1, S2, never, E, A> => {
    const z = new ZPrimitive(ZTag.Provide) as any;
    z.i0    = fa;
    z.i1    = r;
    return z;
  };
}

/**
 * Constructs a computation that sets the state to the specified value.
 *
 * @tsplus static fncts.control.ZOps put
 */
export function put<S>(s: S): Z<never, unknown, S, never, never, void> {
  return Z.modify(() => [undefined, s]);
}

/**
 * Repeats this computation the specified number of times (or until the first failure)
 * passing the updated state to each successive repetition.
 *
 * @tsplus pipeable fncts.control.Z repeatN
 */
export function repeatN(n: number) {
  return <W, S1, S2 extends S1, R, E, A>(ma: Z<W, S1, S2, R, E, A>): Z<W, S1, S2, R, E, A> => {
    return ma.flatMap((a) => (n <= 0 ? Z.succeedNow(a) : ma.repeatN(n - 1)));
  };
}

/**
 * Repeats this computation until its value satisfies the specified predicate
 * (or until the first failure) passing the updated state to each successive repetition.
 *
 * @tsplus pipeable fncts.control.Z repeatUntil
 */
export function repeatUntil<A>(p: Predicate<A>) {
  return <W, S1, S2 extends S1, R, E>(ma: Z<W, S1, S2, R, E, A>): Z<W, S1, S2, R, E, A> => {
    return ma.flatMap((a) => (p(a) ? Z.succeedNow(a) : ma.repeatUntil(p)));
  };
}

/**
 * @tsplus static fncts.control.ZOps succeed
 */
export function succeed<A, W = never, S1 = unknown, S2 = never>(
  effect: Lazy<A>,
  __tsplusTrace?: string,
): Z<W, S1, S2, never, never, A> {
  const z = new ZPrimitive(ZTag.Succeed) as any;
  z.i0    = effect;
  return z;
}

/**
 * @tsplus static fncts.control.ZOps succeedNow
 */
export function succeedNow<A, W = never, S1 = unknown, S2 = never>(
  a: A,
  __tsplusTrace?: string,
): Z<W, S1, S2, never, never, A> {
  const z = new ZPrimitive(ZTag.SucceedNow) as any;
  z.i0    = a;
  return z;
}

/**
 * @tsplus pipeable fncts.control.Z tap
 */
export function tap<S2, A, W1, S3, R1, E1, B>(f: (a: A) => Z<W1, S2, S3, R1, E1, B>) {
  return <W, S1, R, E>(ma: Z<W, S1, S2, R, E, A>): Z<W | W1, S1, S3, R1 & R, E1 | E, A> => {
    return ma.flatMap((a) => f(a).map(() => a));
  };
}

/**
 * @tsplus static fncts.control.ZOps tell
 */
export function tell<W>(w: W): Z<W, unknown, never, never, never, void> {
  return Z.tellAll(Conc.single(w));
}

/**
 * @tsplus static fncts.control.ZOps tellAll
 */
export function tellAll<W>(ws: Conc<W>): Z<W, unknown, never, never, never, void> {
  const z = new ZPrimitive(ZTag.Tell) as any;
  z.i0    = ws;
  return z;
}

/**
 * Like `map`, but also allows the state to be modified.
 *
 * @tsplus pipeable fncts.control.Z transform
 */
export function transform<S2, A, S3, B>(f: (s: S2, a: A) => readonly [B, S3]) {
  return <W, S1, R, E>(ma: Z<W, S1, S2, R, E, A>): Z<W, S1, S3, R, E, B> => {
    return ma.flatMap((a) => Z.modify((s) => f(s, a)));
  };
}

/**
 * @tsplus static fncts.control.ZOps unit
 */
export const unit: Z<never, unknown, never, never, never, void> = Z.succeedNow(undefined);

/**
 * Constructs a computation from the specified update function.
 *
 * @tsplus static fncts.control.ZOps update
 */
export function update<S1, S2>(f: (s: S1) => S2): Z<never, S1, S2, never, never, void> {
  return Z.modify((s) => [undefined, f(s)]);
}

/**
 * @tsplus pipeable fncts.control.Z write
 */
export function write<W1>(w: W1) {
  return <W, S1, S2, R, E, A>(ma: Z<W, S1, S2, R, E, A>): Z<W | W1, S1, S2, R, E, A> => {
    return ma.writeAll(Conc.single(w));
  };
}

/**
 * @tsplus pipeable fncts.control.Z writeAll
 */
export function writeAll<W1>(log: Conc<W1>) {
  return <W, S1, S2, R, E, A>(ma: Z<W, S1, S2, R, E, A>): Z<W | W1, S1, S2, R, E, A> => {
    return ma.mapLog((ws) => ws.concat(log));
  };
}

/**
 * @tsplus pipeable fncts.control.Z zip
 */
export function zip<S2, W1, S3, Q, D, B>(fb: Z<W1, S2, S3, Q, D, B>) {
  return <W, S1, R, E, A>(fa: Z<W, S1, S2, R, E, A>): Z<W | W1, S1, S3, Q & R, D | E, Zipped.Make<A, B>> => {
    return fa.zipWith(fb, (a, b) => Zipped(a, b));
  };
}

/**
 * @tsplus pipeable fncts.control.Z zipFirst
 */
export function zipFirst<S2, W1, S3, Q, D, B>(fb: Z<W1, S2, S3, Q, D, B>) {
  return <W, S1, R, E, A>(fa: Z<W, S1, S2, R, E, A>): Z<W | W1, S1, S3, Q & R, D | E, A> => {
    return fa.zipWith(fb, (a, _) => a);
  };
}

/**
 * @tsplus pipeable fncts.control.Z zipSecond
 */
export function zipSecond<S2, W1, S3, Q, D, B>(fb: Z<W1, S2, S3, Q, D, B>) {
  return <W, S1, R, E, A>(fa: Z<W, S1, S2, R, E, A>): Z<W | W1, S1, S3, Q & R, D | E, B> => {
    return fa.zipWith(fb, (_, b) => b);
  };
}

/**
 * @tsplus pipeable fncts.control.Z zipWith
 */
export function zipWith<S2, A, W1, S3, R1, E1, B, C>(fb: Z<W1, S2, S3, R1, E1, B>, f: (a: A, b: B) => C) {
  return <W, S1, R, E>(fa: Z<W, S1, S2, R, E, A>): Z<W | W1, S1, S3, R1 & R, E1 | E, C> => {
    return fa.flatMap((a) => fb.map((b) => f(a, b)));
  };
}
