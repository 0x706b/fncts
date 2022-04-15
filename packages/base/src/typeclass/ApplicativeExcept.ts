import type { ApplicativeMin } from "@fncts/base/typeclass/Applicative";
import type { Fail, FailMin } from "@fncts/base/typeclass/Fail";

import { identity } from "@fncts/base/data/function";
import { Applicative } from "@fncts/base/typeclass/Applicative";

/**
 * @tsplus type fncts.ApplicativeExcept
 */
export interface ApplicativeExcept<F extends HKT.CovariantE, C = HKT.None> extends Applicative<F, C>, Fail<F, C> {
  readonly catchAll_: CatchAllFn_<F, C>;
  readonly catchAll: CatchAllFn<F, C>;
  readonly catchJust_: CatchJustFn_<F, C>;
  readonly catchJust: CatchJustFn<F, C>;
  readonly either: EitherFn<F, C>;
}

/**
 * @tsplus type fncts.ApplicativeExceptOps
 */
export interface ApplicativeExceptOps {}

export const ApplicativeExcept: ApplicativeExceptOps = {};

export type ApplicativeExceptMin<F extends HKT.CovariantE, C = HKT.None> = ApplicativeMin<F, C> &
  FailMin<F, C> & {
    readonly catchAll_: CatchAllFn_<F, C>;
  };

/**
 * @tsplus static fncts.ApplicativeExceptOps __call
 */
export function mkApplicativeExcept<F extends HKT.CovariantE, C = HKT.None>(
  F: ApplicativeExceptMin<F, C>,
): ApplicativeExcept<F, C>;
export function mkApplicativeExcept<F>(F: ApplicativeExceptMin<HKT.FCoE<F>>): ApplicativeExcept<HKT.FCoE<F>> {
  const ApplicativeF = Applicative(F);
  const catchJust_   = catchJustF_(F);
  return HKT.instance<ApplicativeExcept<HKT.FCoE<F>>>({
    ...ApplicativeF,
    catchAll_: F.catchAll_,
    catchAll: (f) => (fa) => F.catchAll_(fa, f),
    catchJust_,
    catchJust: (f) => (fa) => catchJust_(fa, f),
    either: eitherF(F),
    fail: F.fail,
  });
}

export interface CatchAllFn_<F extends HKT.CovariantE, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, A1>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    f: (
      e: HKT.OrFix<C, "E", E>,
    ) => HKT.Kind<
      F,
      C,
      HKT.Intro<F, "K", K, K1>,
      HKT.Intro<F, "Q", Q, Q1>,
      HKT.Intro<F, "W", W, W1>,
      HKT.Intro<F, "X", X, X1>,
      HKT.Intro<F, "I", I, I1>,
      HKT.Intro<F, "S", S, S1>,
      HKT.Intro<F, "R", R, R1>,
      HKT.Intro<F, "E", E, E1>,
      A1
    >,
  ): HKT.Kind<
    F,
    C,
    HKT.Mix<F, "K", [K, K1]>,
    HKT.Mix<F, "Q", [Q, Q1]>,
    HKT.Mix<F, "W", [W, W1]>,
    HKT.Mix<F, "X", [X, X1]>,
    HKT.Mix<F, "I", [I, I1]>,
    HKT.Mix<F, "S", [S, S1]>,
    HKT.Mix<F, "R", [R, R1]>,
    E1,
    A | A1
  >;
}

export interface CatchAllFn<F extends HKT.CovariantE, C = HKT.None> {
  <E, K1, Q1, W1, X1, I1, S1, R1, E1, A1>(
    f: (e: HKT.OrFix<C, "E", E>) => HKT.Kind<F, C, K1, Q1, W1, X1, I1, S1, R1, E1, A1>,
  ): <K, Q, W, X, I, S, R, A>(
    fa: HKT.Kind<
      F,
      C,
      HKT.Intro<F, "K", K1, K>,
      HKT.Intro<F, "Q", Q1, Q>,
      HKT.Intro<F, "W", W1, W>,
      HKT.Intro<F, "X", X1, X>,
      HKT.Intro<F, "I", I1, I>,
      HKT.Intro<F, "S", S1, S>,
      HKT.Intro<F, "R", R1, R>,
      HKT.Intro<F, "E", E1, E>,
      A
    >,
  ) => HKT.Kind<
    F,
    C,
    HKT.Mix<F, "K", [K1, K]>,
    HKT.Mix<F, "Q", [Q1, Q]>,
    HKT.Mix<F, "W", [W1, W]>,
    HKT.Mix<F, "X", [X1, X]>,
    HKT.Mix<F, "I", [I1, I]>,
    HKT.Mix<F, "S", [S1, S]>,
    HKT.Mix<F, "R", [R1, R]>,
    E1,
    A | A1
  >;
}

export interface CatchJustFn_<F extends HKT.CovariantE, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, A1>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    f: (
      e: HKT.OrFix<C, "E", E>,
    ) => Maybe<
      HKT.Kind<
        F,
        C,
        HKT.Intro<F, "K", K, K1>,
        HKT.Intro<F, "Q", Q, Q1>,
        HKT.Intro<F, "W", W, W1>,
        HKT.Intro<F, "X", X, X1>,
        HKT.Intro<F, "I", I, I1>,
        HKT.Intro<F, "S", S, S1>,
        HKT.Intro<F, "R", R, R1>,
        HKT.Intro<F, "E", E, E1>,
        A1
      >
    >,
  ): HKT.Kind<
    F,
    C,
    HKT.Mix<F, "K", [K, K1]>,
    HKT.Mix<F, "Q", [Q, Q1]>,
    HKT.Mix<F, "W", [W, W1]>,
    HKT.Mix<F, "X", [X, X1]>,
    HKT.Mix<F, "I", [I, I1]>,
    HKT.Mix<F, "S", [S, S1]>,
    HKT.Mix<F, "R", [R, R1]>,
    HKT.Mix<F, "E", [E, E1]>,
    A | A1
  >;
}

/**
 * @tsplus static fncts.ApplicativeExceptOps catchJustF_
 */
export function catchJustF_<F extends HKT.CovariantE, C = HKT.None>(F: ApplicativeExceptMin<F, C>): CatchJustFn_<F, C>;
export function catchJustF_<F>(F: ApplicativeExceptMin<HKT.FCoE<F>>): CatchJustFn_<HKT.FCoE<F>> {
  return <K, Q, W, X, I, S, R, E, A, E1, A1>(
    fa: HKT.FK<F, K, Q, W, X, I, S, R, E, A>,
    f: (e: E) => Maybe<HKT.FK<F, K, Q, W, X, I, S, R, E1, A1>>,
  ): HKT.FK<F, K, Q, W, X, I, S, R, E | E1, A | A1> =>
    F.catchAll_(fa, (e) => f(e).match(() => F.fail(e) as HKT.FK<F, K, Q, W, X, I, S, R, E | E1, A | A1>, identity));
}

export interface CatchJustFn<F extends HKT, C = HKT.None> {
  <E, K1, Q1, W1, X1, I1, S1, R1, E1, A1>(
    f: (e: HKT.OrFix<C, "E", E>) => Maybe<HKT.Kind<F, C, K1, Q1, W1, X1, I1, S1, R1, E1, A1>>,
  ): <K, Q, W, X, I, S, R, A>(
    fa: HKT.Kind<
      F,
      C,
      HKT.Intro<F, "K", K1, K>,
      HKT.Intro<F, "Q", Q1, Q>,
      HKT.Intro<F, "W", W1, W>,
      HKT.Intro<F, "X", X1, X>,
      HKT.Intro<F, "I", I1, I>,
      HKT.Intro<F, "S", S1, S>,
      HKT.Intro<F, "R", R1, R>,
      HKT.Intro<F, "E", E1, E>,
      A
    >,
  ) => HKT.Kind<
    F,
    C,
    HKT.Mix<F, "K", [K1, K]>,
    HKT.Mix<F, "Q", [Q1, Q]>,
    HKT.Mix<F, "W", [W1, W]>,
    HKT.Mix<F, "X", [X1, X]>,
    HKT.Mix<F, "I", [I1, I]>,
    HKT.Mix<F, "S", [S1, S]>,
    HKT.Mix<F, "R", [R1, R]>,
    HKT.Mix<F, "E", [E1, E]>,
    A | A1
  >;
}

/**
 * @tsplus static fncts.ApplicativeExceptOps catchJustF
 */
export function catchJustF<F extends HKT.CovariantE, C = HKT.None>(F: ApplicativeExceptMin<F, C>): CatchJustFn<F, C>;
export function catchJustF<F>(F: ApplicativeExceptMin<HKT.FCoE<F>>): CatchJustFn<HKT.FCoE<F>> {
  return <K, Q, W, X, I, S, R, E, E1, A1>(f: (e: E) => Maybe<HKT.FK<F, K, Q, W, X, I, S, R, E1, A1>>) =>
    <A>(fa: HKT.FK<F, K, Q, W, X, I, S, R, E, A>): HKT.FK<F, K, Q, W, X, I, S, R, E | E1, A | A1> =>
      F.catchAll_(fa, (e) => f(e).match(() => F.fail(e) as HKT.FK<F, K, Q, W, X, I, S, R, E | E1, A | A1>, identity));
}

export interface EitherFn<F extends HKT, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, A>(fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>): HKT.Kind<
    F,
    C,
    K,
    Q,
    W,
    X,
    I,
    S,
    R,
    never,
    Either<HKT.OrFix<C, "E", E>, A>
  >;
}

/**
 * @tsplus static fncts.ApplicativeExceptOps eitherF
 */
export function eitherF<F extends HKT.CovariantE, C = HKT.None>(F: ApplicativeExceptMin<F, C>): EitherFn<F, C>;
export function eitherF<F>(F: ApplicativeExceptMin<HKT.FCoE<F>>): EitherFn<HKT.FCoE<F>> {
  return (fa) => F.catchAll_(F.map_(fa, Either.right), (e) => F.pure(Either.left(e)));
}
