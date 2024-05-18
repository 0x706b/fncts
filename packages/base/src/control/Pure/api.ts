import { PurePrimitive, PureTag } from "@fncts/base/control/Pure/definition";

import { identity, tuple } from "../../data/function.js";

/**
 * @tsplus getter fncts.control.Pure absolve
 */
export function absolve<W, S1, S2, R, E, E1, A>(
  fa: Pure<W, S1, S2, R, E, Either<E1, A>>,
): Pure<W, S1, S2, R, E | E1, A> {
  return fa.flatMap((ea) => ea.match(Pure.failNow, Pure.succeedNow));
}

/**
 * @tsplus pipeable fncts.control.Pure ap
 */
export function ap<W, S, A, R1, E1>(fb: Pure<W, S, S, R1, E1, A>) {
  return <R, E, B>(self: Pure<W, S, S, R, E, (a: A) => B>): Pure<W, S, S, R & R1, E | E1, B> => {
    return self.crossWith(fb, (f, a) => f(a));
  };
}

/**
 * @tsplus pipeable fncts.control.Pure zipLeft
 */
export function zipLeft<W, S, R1, E1, B>(fb: Pure<W, S, S, R1, E1, B>) {
  return <R, E, A>(fa: Pure<W, S, S, R, E, A>): Pure<W, S, S, R & R1, E | E1, A> => {
    return fa.crossWith(fb, (a, _) => a);
  };
}

/**
 * @tsplus pipeable fncts.control.Pure zipRight
 */
export function zipRight<W, S, R1, E1, B>(fb: Pure<W, S, S, R1, E1, B>) {
  return <R, E, A>(fa: Pure<W, S, S, R, E, A>): Pure<W, S, S, R & R1, E | E1, B> => {
    return fa.crossWith(fb, (_, b) => b);
  };
}

/**
 * @tsplus pipeable fncts.control.Pure bimap
 */
export function bimap<E, A, G, B>(f: (e: E) => G, g: (a: A) => B) {
  return <W, S1, S2, R>(pab: Pure<W, S1, S2, R, E, A>): Pure<W, S1, S2, R, G, B> => {
    return pab.matchPure(
      (e) => Pure.failNow(f(e)),
      (a) => Pure.succeedNow(g(a)),
    );
  };
}

/**
 * Recovers from all errors.
 *
 * @tsplus pipeable fncts.control.Pure catchAll
 */
export function catchAll<W, S1, E, S3, R1, E1, B>(onFailure: (e: E) => Pure<W, S1, S3, R1, E1, B>) {
  return <S2, R, A>(fa: Pure<W, S1, S2, R, E, A>): Pure<W, S1, S3, R | R1, E1, A | B> => {
    return fa.matchPure(onFailure, Pure.succeedNow);
  };
}

/**
 * @tsplus pipeable fncts.control.Pure catchJust
 */
export function catchJust<W, S1, E, S3, R1, E1, B>(f: (e: E) => Maybe<Pure<W, S1, S3, R1, E1, B>>) {
  return <S2, R, A>(fa: Pure<W, S1, S2, R, E, A>): Pure<W, S1, S2 | S3, R | R1, E | E1, A | B> => {
    return fa.catchAll((e) => f(e).getOrElse(fa));
  };
}

/**
 * @tsplus pipeable fncts.control.Pure flatMap
 */
export function flatMap<S2, A, W1, S3, R1, E1, B>(f: (a: A) => Pure<W1, S2, S3, R1, E1, B>) {
  return <W, S1, R, E>(ma: Pure<W, S1, S2, R, E, A>): Pure<W | W1, S1, S3, R1 & R, E1 | E, B> => {
    const z = new PurePrimitive(PureTag.Chain) as any;
    z.i0    = ma;
    z.i1    = f;
    return z;
  };
}

/**
 * @tsplus pipeable fncts.control.Pure contramapEnvironment
 */
export function contramapEnvironment<R0, R>(f: (r0: Environment<R0>) => Environment<R>) {
  return <W, S1, S2, E, A>(ma: Pure<W, S1, S2, R, E, A>): Pure<W, S1, S2, R0, E, A> => {
    return Pure.environmentWithPure((r) => ma.provideEnvironment(f(r)));
  };
}

/**
 * Transforms the initial state of this computation` with the specified
 * function.
 *
 * @tsplus pipeable fncts.control.Pure contramapState
 */
export function contramapState<S0, S1>(f: (s: S0) => S1) {
  return <W, S2, R, E, A>(fa: Pure<W, S1, S2, R, E, A>): Pure<W, S0, S2, R, E, A> => {
    return Pure.update(f).flatMap(() => fa);
  };
}

/**
 * @tsplus pipeable fncts.control.Pure cross
 */
export function cross<W, S, R1, E1, B>(fb: Pure<W, S, S, R1, E1, B>) {
  return <R, E, A>(fa: Pure<W, S, S, R, E, A>): Pure<W, S, S, R & R1, E | E1, readonly [A, B]> => {
    return fa.crossWith(fb, tuple);
  };
}

/**
 * @tsplus pipeable fncts.control.Pure crossWith
 */
export function crossWith<W, S, A, R1, E1, B, C>(fb: Pure<W, S, S, R1, E1, B>, f: (a: A, b: B) => C) {
  return <R, E>(fa: Pure<W, S, S, R, E, A>): Pure<W, S, S, R & R1, E | E1, C> => {
    return fa.flatMap((a) => fb.map((b) => f(a, b)));
  };
}

/**
 * @tsplus static fncts.control.PureOps defer
 */
export function defer<W, S1, S2, R, E, A>(
  ma: Lazy<Pure<W, S1, S2, R, E, A>>,
  __tsplusTrace?: string,
): Pure<W, S1, S2, R, E, A> {
  const z = new PurePrimitive(PureTag.Defer) as any;
  z.i0    = ma;
  return z;
}

/**
 * Returns a computation whose failure and success have been lifted into an
 * `Either`. The resulting computation cannot fail, because the failure case
 * has been exposed as part of the `Either` success case.
 *
 * @tsplus getter fncts.control.Pure either
 */
export function either<W, S1, S2, R, E, A>(fa: Pure<W, S1, S2, R, E, A>): Pure<W, S1, S1 | S2, R, never, Either<E, A>> {
  return fa.match(Either.left, Either.right);
}

/**
 * @tsplus static fncts.control.PureOps environment
 */
export function environment<R>(): Pure<never, unknown, never, R, never, Environment<R>> {
  const z = new PurePrimitive(PureTag.Access) as any;
  z.i0    = (r: any) => Pure.succeedNow(r);
  return z;
}

/**
 * @tsplus static fncts.control.PureOps environmentWith
 */
export function environmentWith<R0, A>(f: (r: Environment<R0>) => A): Pure<never, unknown, never, R0, never, A> {
  const z = new PurePrimitive(PureTag.Access) as any;
  z.i0    = (r: any) => Pure.succeedNow(f(r));
  return z;
}

/**
 * @tsplus static fncts.control.PureOps environmentWithPure
 */
export function environmentWithPure<R0, W, S1, S2, R, E, A>(
  f: (r: Environment<R0>) => Pure<W, S1, S2, R, E, A>,
): Pure<W, S1, S2, R | R0, E, A> {
  const z = new PurePrimitive(PureTag.Access) as any;
  z.i0    = f;
  return z;
}

/**
 * Erases the current log
 *
 * @tsplus getter fncts.control.Pure erase
 */
export function erase<W, S1, S2, R, E, A>(wa: Pure<W, S1, S2, R, E, A>): Pure<never, S1, S2, R, E, A> {
  return wa.mapLog(() => Conc.empty());
}

/**
 * @tsplus static fncts.control.PureOps fail
 */
export function fail<E>(e: Lazy<E>, __tsplusTrace?: string): Pure<never, unknown, never, never, E, never> {
  return Pure.failCause(Cause.fail(e()));
}

/**
 * @tsplus static fncts.control.PureOps failNow
 */
export function failNow<E>(e: E, __tsplusTrace?: string): Pure<never, unknown, never, never, E, never> {
  return Pure.failCauseNow(Cause.fail(e));
}

/**
 * @tsplus static fncts.control.PureOps failCause
 */
export function failCause<E>(
  cause: Lazy<Cause<E>>,
  __tsplusTrace?: string,
): Pure<never, unknown, never, never, E, never> {
  return Pure.defer(Pure.failCauseNow(cause()));
}

/**
 * @tsplus static fncts.control.PureOps failCauseNow
 */
export function failCauseNow<E>(cause: Cause<E>, __tsplusTrace?: string): Pure<never, unknown, never, never, E, never> {
  const z = new PurePrimitive(PureTag.Fail) as any;
  z.i0    = cause;
  return z;
}

/**
 * @tsplus getter fncts.control.Pure flatten
 */
export function flatten<W, S1, S2, R, E, A, W1, S3, R1, E1>(
  mma: Pure<W, S1, S2, R, E, Pure<W1, S2, S3, R1, E1, A>>,
): Pure<W | W1, S1, S3, R1 & R, E1 | E, A> {
  return mma.flatMap(identity);
}

/**
 * Constructs a computation that returns the initial state unchanged.
 *
 * @tsplus static fncts.control.PureOps get
 */
export function get<S>(): Pure<never, S, S, never, never, S> {
  return Pure.modify((s) => [s, s]);
}

/**
 * @tsplus static fncts.control.PureOps gets
 */
export function gets<S, A>(f: (s: S) => A): Pure<never, S, S, never, never, A> {
  return Pure.modify((s) => [f(s), s]);
}

/**
 * @tsplus static fncts.control.PureOps getsPure
 */
export function getsPure<S, W, R, E, A>(f: (s: S) => Pure<W, S, S, R, E, A>): Pure<W, S, S, R, E, A> {
  return Pure.get<S>().flatMap(f);
}

/**
 * @tsplus static fncts.control.PureOps halt
 */
export function halt(defect: Lazy<unknown>, __tsplusTrace?: string): Pure<never, unknown, never, never, never, never> {
  return Pure.failCause(Cause.halt(defect()));
}

/**
 * @tsplus static fncts.control.PureOps haltNow
 */
export function haltNow(defect: unknown, __tsplusTrace?: string): Pure<never, unknown, never, never, never, never> {
  return Pure.failCauseNow(Cause.halt(defect));
}

/**
 * @tsplus getter fncts.control.Pure listen
 */
export function listen<W, S1, S2, R, E, A>(wa: Pure<W, S1, S2, R, E, A>): Pure<W, S1, S2, R, E, readonly [A, Conc<W>]> {
  return wa.matchLogCausePure(
    (_, e) => Pure.failCauseNow(e),
    (ws, a) => Pure.succeedNow([a, ws]),
  );
}

/**
 * @tsplus pipeable fncts.control.Pure listens
 */
export function listens<W, B>(f: (log: Conc<W>) => B) {
  return <S1, S2, R, E, A>(wa: Pure<W, S1, S2, R, E, A>): Pure<W, S1, S2, R, E, readonly [A, B]> => {
    return wa.listen.map(([a, ws]) => [a, f(ws)]);
  };
}

/**
 * @tsplus pipeable fncts.control.Pure map
 */
export function map<A, B>(f: (a: A) => B) {
  return <W, S1, S2, R, E>(fa: Pure<W, S1, S2, R, E, A>): Pure<W, S1, S2, R, E, B> => {
    return fa.flatMap((a) => Pure.succeedNow(f(a)));
  };
}

/**
 * @tsplus pipeable fncts.control.Pure mapError
 */
export function mapError<E, G>(f: (e: E) => G) {
  return <W, S1, S2, R, A>(pab: Pure<W, S1, S2, R, E, A>): Pure<W, S1, S2, R, G, A> => {
    return pab.matchPure((e) => Pure.failNow(f(e)), Pure.succeedNow);
  };
}

/**
 * Modifies the current log with the specified function
 *
 * @tsplus pipeable fncts.control.Pure mapLog
 */
export function mapLog<W, W1>(f: (ws: Conc<W>) => Conc<W1>) {
  return <S1, S2, R, E, A>(wa: Pure<W, S1, S2, R, E, A>): Pure<W1, S1, S2, R, E, A> => {
    const z = new PurePrimitive(PureTag.MapLog) as any;
    z.i0    = wa;
    z.i1    = f;
    return z;
  };
}

/**
 * Modifies the current state with the specified function
 *
 * @tsplus pipeable fncts.control.Pure mapState
 */
export function mapState<S2, S3>(f: (s: S2) => S3) {
  return <W, S1, R, E, A>(ma: Pure<W, S1, S2, R, E, A>): Pure<W, S1, S3, R, E, A> => {
    return ma.transform((s, a) => [a, f(s)]);
  };
}

/**
 * Folds over the failed or successful results of this computation to yield
 * a computation that does not fail, but succeeds with the value of the left
 * or right function passed to `match`.
 *
 * @tsplus pipeable fncts.control.Pure match
 */
export function match<E, A, B, C>(onFailure: (e: E) => B, onSuccess: (a: A) => C) {
  return <W, S1, S2, R>(fa: Pure<W, S1, S2, R, E, A>): Pure<W, S1, S2, R, never, B | C> => {
    return fa.matchPure(
      (e) => Pure.succeedNow(onFailure(e)),
      (a) => Pure.succeedNow(onSuccess(a)),
    );
  };
}

/**
 * Recovers from errors by accepting one computation to execute for the case
 * of an error, and one computation to execute for the case of success.
 *
 * @tsplus pipeable fncts.control.Pure matchPure
 */
export function matchPure<S5, S2, E, A, W1, S3, R1, E1, B, W2, S4, R2, E2, C>(
  onFailure: (e: E) => Pure<W1, S5, S3, R1, E1, B>,
  onSuccess: (a: A) => Pure<W2, S2, S4, R2, E2, C>,
) {
  return <W, S1, R>(fa: Pure<W, S1, S2, R, E, A>): Pure<W | W1 | W2, S1 & S5, S3 | S4, R | R1 | R2, E1 | E2, B | C> => {
    return fa.matchCausePure((cause) => cause.failureOrCause.match(onFailure, Pure.failCauseNow), onSuccess);
  };
}

/**
 * @tsplus pipeable fncts.control.Pure matchCausePure
 */
export function matchCausePure<S2, E, A, W1, S0, S3, R1, E1, B, W2, S4, R2, E2, C>(
  onFailure: (e: Cause<E>) => Pure<W1, S0, S3, R1, E1, B>,
  onSuccess: (a: A) => Pure<W2, S2, S4, R2, E2, C>,
) {
  return <W, S1, R>(fa: Pure<W, S1, S2, R, E, A>): Pure<W | W1 | W2, S0 & S1, S3 | S4, R | R1 | R2, E1 | E2, B | C> => {
    return fa.matchLogCausePure(
      (ws, e) => onFailure(e).mapLog((w1s) => ws.concat(w1s)),
      (ws, a) => onSuccess(a).mapLog((w2s) => ws.concat(w2s)),
    );
  };
}

/**
 * @tsplus pipeable fncts.control.Pure matchLogPure
 */
export function matchLogPure<W, S5, S2, E, A, W1, S3, R1, E1, B, W2, S4, R2, E2, C>(
  onFailure: (ws: Conc<W>, e: E) => Pure<W1, S5, S3, R1, E1, B>,
  onSuccess: (ws: Conc<W>, a: A) => Pure<W2, S2, S4, R2, E2, C>,
) {
  return <S1, R>(fa: Pure<W, S1, S2, R, E, A>): Pure<W | W1 | W2, S1 & S5, S3 | S4, R | R1 | R2, E1 | E2, B | C> => {
    return fa.matchLogCausePure(
      (ws, cause) => cause.failureOrCause.match((e) => onFailure(ws, e), Pure.failCauseNow),
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
 * @tsplus pipeable fncts.control.Pure matchLogCausePure
 */
export function matchLogCausePure<W, S2, E, A, W1, S0, S3, R1, E1, B, W2, S4, R2, E2, C>(
  onFailure: (ws: Conc<W>, e: Cause<E>) => Pure<W1, S0, S3, R1, E1, B>,
  onSuccess: (ws: Conc<W>, a: A) => Pure<W2, S2, S4, R2, E2, C>,
) {
  return <S1, R>(fa: Pure<W, S1, S2, R, E, A>): Pure<W1 | W2, S0 & S1, S3 | S4, R & R1 & R2, E1 | E2, B | C> => {
    const z = new PurePrimitive(PureTag.Match) as any;
    z.i0    = fa;
    z.i1    = onFailure;
    z.i2    = onSuccess;
    return z;
  };
}

/**
 * Constructs a computation from the specified modify function
 *
 * @tsplus static fncts.control.PureOps modify
 */
export function modify<S1, S2, A>(f: (s: S1) => readonly [A, S2]): Pure<never, S1, S2, never, never, A> {
  const z = new PurePrimitive(PureTag.Modify) as any;
  z.i0    = f;
  return z;
}

/**
 * Constructs a computation that may fail from the specified modify function.
 *
 * @tsplus static fncts.control.PureOps modifyEither
 */
export function modifyEither<S1, S2, E, A>(
  f: (s: S1) => Either<E, readonly [A, S2]>,
): Pure<never, S1, S2, never, E, A> {
  return Pure.get<S1>()
    .map(f)
    .flatMap((r) => r.match(Pure.failNow, ([a, s2]) => Pure.succeedNow(a).mapState(() => s2)));
}

/**
 * @tsplus pipeable fncts.control.Pure orElse
 */
export function orElse<S1, W1, S3, R1, E1, A1>(fb: Lazy<Pure<W1, S1, S3, R1, E1, A1>>) {
  return <W, S2, R, E, A>(fa: Pure<W, S1, S2, R, E, A>): Pure<W | W1, S1, S2 | S3, R | R1, E | E1, A | A1> => {
    return fa.matchPure(() => fb(), Pure.succeedNow);
  };
}

/**
 * Executes this computation and returns its value, if it succeeds, but
 * otherwise executes the specified computation.
 *
 * @tsplus pipeable fncts.control.Pure orElseEither
 */
export function orElseEither<W, S3, S4, R1, E1, A1>(that: Lazy<Pure<W, S3, S4, R1, E1, A1>>) {
  return <S1, S2, R, E, A>(fa: Pure<W, S1, S2, R, E, A>): Pure<W, S1 & S3, S2 | S4, R | R1, E1, Either<A, A1>> => {
    return fa.matchPure(
      () => that().map(Either.right),
      (a) => Pure.succeedNow(Either.left(a)),
    );
  };
}

/**
 * @tsplus pipeable fncts.control.Pure provideEnvironment
 */
export function provideEnvironment<R>(r: Environment<R>) {
  return <W, S1, S2, E, A>(fa: Pure<W, S1, S2, R, E, A>): Pure<W, S1, S2, never, E, A> => {
    const z = new PurePrimitive(PureTag.Provide) as any;
    z.i0    = fa;
    z.i1    = r;
    return z;
  };
}

/**
 * Constructs a computation that sets the state to the specified value.
 *
 * @tsplus static fncts.control.PureOps put
 */
export function put<S>(s: S): Pure<never, unknown, S, never, never, void> {
  return Pure.modify(() => [undefined, s]);
}

/**
 * Repeats this computation the specified number of times (or until the first failure)
 * passing the updated state to each successive repetition.
 *
 * @tsplus pipeable fncts.control.Pure repeatN
 */
export function repeatN(n: number) {
  return <W, S1, S2 extends S1, R, E, A>(ma: Pure<W, S1, S2, R, E, A>): Pure<W, S1, S2, R, E, A> => {
    return ma.flatMap((a) => (n <= 0 ? Pure.succeedNow(a) : ma.repeatN(n - 1)));
  };
}

/**
 * Repeats this computation until its value satisfies the specified predicate
 * (or until the first failure) passing the updated state to each successive repetition.
 *
 * @tsplus pipeable fncts.control.Pure repeatUntil
 */
export function repeatUntil<A>(p: Predicate<A>) {
  return <W, S1, S2 extends S1, R, E>(ma: Pure<W, S1, S2, R, E, A>): Pure<W, S1, S2, R, E, A> => {
    return ma.flatMap((a) => (p(a) ? Pure.succeedNow(a) : ma.repeatUntil(p)));
  };
}

/**
 * @tsplus static fncts.control.PureOps succeed
 */
export function succeed<A, W = never, S1 = unknown, S2 = never>(
  effect: Lazy<A>,
  __tsplusTrace?: string,
): Pure<W, S1, S2, never, never, A> {
  const z = new PurePrimitive(PureTag.Succeed) as any;
  z.i0    = effect;
  return z;
}

/**
 * @tsplus static fncts.control.PureOps succeedNow
 */
export function succeedNow<A, W = never, S1 = unknown, S2 = never>(
  a: A,
  __tsplusTrace?: string,
): Pure<W, S1, S2, never, never, A> {
  const z = new PurePrimitive(PureTag.SucceedNow) as any;
  z.i0    = a;
  return z;
}

/**
 * @tsplus pipeable fncts.control.Pure tap
 */
export function tap<S2, A, W1, S3, R1, E1, B>(f: (a: A) => Pure<W1, S2, S3, R1, E1, B>) {
  return <W, S1, R, E>(ma: Pure<W, S1, S2, R, E, A>): Pure<W | W1, S1, S3, R1 & R, E1 | E, A> => {
    return ma.flatMap((a) => f(a).map(() => a));
  };
}

/**
 * @tsplus static fncts.control.PureOps tell
 */
export function tell<W>(w: W): Pure<W, unknown, never, never, never, void> {
  return Pure.tellAll(Conc.single(w));
}

/**
 * @tsplus static fncts.control.PureOps tellAll
 */
export function tellAll<W>(ws: Conc<W>): Pure<W, unknown, never, never, never, void> {
  const z = new PurePrimitive(PureTag.Tell) as any;
  z.i0    = ws;
  return z;
}

/**
 * Like `map`, but also allows the state to be modified.
 *
 * @tsplus pipeable fncts.control.Pure transform
 */
export function transform<S2, A, S3, B>(f: (s: S2, a: A) => readonly [B, S3]) {
  return <W, S1, R, E>(ma: Pure<W, S1, S2, R, E, A>): Pure<W, S1, S3, R, E, B> => {
    return ma.flatMap((a) => Pure.modify((s) => f(s, a)));
  };
}

/**
 * @tsplus static fncts.control.PureOps unit
 */
export const unit: Pure<never, unknown, never, never, never, void> = Pure.succeedNow(undefined);

/**
 * Constructs a computation from the specified update function.
 *
 * @tsplus static fncts.control.PureOps update
 */
export function update<S1, S2>(f: (s: S1) => S2): Pure<never, S1, S2, never, never, void> {
  return Pure.modify((s) => [undefined, f(s)]);
}

/**
 * @tsplus pipeable fncts.control.Pure write
 */
export function write<W1>(w: W1) {
  return <W, S1, S2, R, E, A>(ma: Pure<W, S1, S2, R, E, A>): Pure<W | W1, S1, S2, R, E, A> => {
    return ma.writeAll(Conc.single(w));
  };
}

/**
 * @tsplus pipeable fncts.control.Pure writeAll
 */
export function writeAll<W1>(log: Conc<W1>) {
  return <W, S1, S2, R, E, A>(ma: Pure<W, S1, S2, R, E, A>): Pure<W | W1, S1, S2, R, E, A> => {
    return ma.mapLog((ws) => ws.concat(log));
  };
}

/**
 * @tsplus pipeable fncts.control.Pure zip
 */
export function zip<S2, W1, S3, Q, D, B>(fb: Pure<W1, S2, S3, Q, D, B>) {
  return <W, S1, R, E, A>(fa: Pure<W, S1, S2, R, E, A>): Pure<W | W1, S1, S3, Q & R, D | E, Zipped.Make<A, B>> => {
    return fa.zipWith(fb, (a, b) => Zipped(a, b));
  };
}

/**
 * @tsplus pipeable fncts.control.Pure zipFirst
 */
export function zipFirst<S2, W1, S3, Q, D, B>(fb: Pure<W1, S2, S3, Q, D, B>) {
  return <W, S1, R, E, A>(fa: Pure<W, S1, S2, R, E, A>): Pure<W | W1, S1, S3, Q & R, D | E, A> => {
    return fa.zipWith(fb, (a, _) => a);
  };
}

/**
 * @tsplus pipeable fncts.control.Pure zipSecond
 */
export function zipSecond<S2, W1, S3, Q, D, B>(fb: Pure<W1, S2, S3, Q, D, B>) {
  return <W, S1, R, E, A>(fa: Pure<W, S1, S2, R, E, A>): Pure<W | W1, S1, S3, Q & R, D | E, B> => {
    return fa.zipWith(fb, (_, b) => b);
  };
}

/**
 * @tsplus pipeable fncts.control.Pure zipWith
 */
export function zipWith<S2, A, W1, S3, R1, E1, B, C>(fb: Pure<W1, S2, S3, R1, E1, B>, f: (a: A, b: B) => C) {
  return <W, S1, R, E>(fa: Pure<W, S1, S2, R, E, A>): Pure<W | W1, S1, S3, R1 & R, E1 | E, C> => {
    return fa.flatMap((a) => fb.map((b) => f(a, b)));
  };
}
