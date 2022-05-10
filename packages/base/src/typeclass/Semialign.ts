import type { FunctorMin } from "@fncts/base/typeclass/Functor";
import type { Semigroup } from "@fncts/base/typeclass/Semigroup";

import { identity, tuple } from "@fncts/base/data/function";
import { Functor } from "@fncts/base/typeclass/Functor";

/**
 * @tsplus type fncts.Semialign
 */
export interface Semialign<F extends HKT, C = HKT.None> extends Functor<F, C> {
  readonly alignWith_: alignWith_<F, C>;
  readonly alignWith: alignWith<F, C>;
  readonly align_: align_<F, C>;
  readonly align: align<F, C>;
  readonly alignCombine_: alignCombine_<F, C>;
  readonly alignCombine: alignCombine<F, C>;
  readonly padZip_: padZip_<F, C>;
  readonly padZip: padZip<F, C>;
  readonly padZipWith_: padZipWith_<F, C>;
  readonly padZipWith: padZipWith<F, C>;
  readonly zipAll_: zipAll_<F, C>;
  readonly zipAll: zipAll<F, C>;
}

/**
 * @tsplus type fncts.SemialignOps
 */
export interface SemialignOps {}

export const Semialign: SemialignOps = {};

export type SemialignMin<F extends HKT, C = HKT.None> = (
  | { readonly alignWith_: alignWith_<F, C> }
  | { readonly align_: align_<F, C> }
) &
  FunctorMin<F, C>;

/**
 * @tsplus static fncts.SemialignOps __call
 */
export function mkSemialign<F extends HKT, C = HKT.None>(F: SemialignMin<F, C>): Semialign<F, C>;
export function mkSemialign<F>(F: SemialignMin<HKT.F<F>>): Semialign<HKT.F<F>> {
  const alignCombine_ = alignCombineF_(F);
  const padZip_       = padZipF_(F);
  const padZipWith_   = padZipWithF_(F);
  const zipAll_       = zipAllF_(F);
  if ("alignWith_" in F) {
    const align_: align_<HKT.F<F>> = (fa, fb) => F.alignWith_(fa, fb, identity);
    return HKT.instance<Semialign<HKT.F<F>>>({
      ...Functor(F),
      alignWith_: F.alignWith_,
      alignWith: (fb, f) => (fa) => F.alignWith_(fa, fb, f),
      align_,
      align: (fb) => (fa) => align_(fa, fb),
      alignCombine_,
      alignCombine: (S) => (fb) => (fa) => alignCombine_(fa, fb, S),
      padZip_,
      padZip: (fb) => (fa) => padZip_(fa, fb),
      padZipWith_,
      padZipWith: (fb, f) => (fa) => padZipWith_(fa, fb, f),
      zipAll_,
      zipAll: (fb, a, b) => (fa) => zipAll_(fa, fb, a, b),
    });
  } else {
    const alignWith_: Semialign<HKT.F<F>>["alignWith_"] = (fa, fb, f) => F.map_(F.align_(fa, fb), f);
    return HKT.instance<Semialign<HKT.F<F>>>({
      ...Functor(F),
      alignWith_,
      alignWith: (fb, f) => (fa) => alignWith_(fa, fb, f),
      align_: F.align_,
      align: (fb) => (fa) => F.align_(fa, fb),
      alignCombine_,
      alignCombine: (S) => (fb) => (fa) => alignCombine_(fa, fb, S),
      padZip_,
      padZip: (fb) => (fa) => padZip_(fa, fb),
      padZipWith_,
      padZipWith: (fb, f) => (fa) => padZipWith_(fa, fb, f),
      zipAll_,
      zipAll: (fb, a, b) => (fa) => zipAll_(fa, fb, a, b),
    });
  }
}

export interface align_<F extends HKT, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    fb: HKT.Kind<
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
      B
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
    These<A, B>
  >;
}

export interface align<F extends HKT, C = HKT.None> {
  <K1, Q1, W1, X1, I1, S1, R1, E1, B>(fb: HKT.Kind<F, C, K1, Q1, W1, X1, I1, S1, R1, E1, B>): <
    K,
    Q,
    W,
    X,
    I,
    S,
    R,
    E,
    A,
  >(
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
    These<A, B>
  >;
}

export interface alignWith_<F extends HKT, TC = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B, C>(
    fa: HKT.Kind<F, TC, K, Q, W, X, I, S, R, E, A>,
    fb: HKT.Kind<
      F,
      TC,
      HKT.Intro<F, "K", K, K1>,
      HKT.Intro<F, "Q", Q, Q1>,
      HKT.Intro<F, "W", W, W1>,
      HKT.Intro<F, "X", X, X1>,
      HKT.Intro<F, "I", I, I1>,
      HKT.Intro<F, "S", S, S1>,
      HKT.Intro<F, "R", R, R1>,
      HKT.Intro<F, "E", E, E1>,
      B
    >,
    f: (th: These<A, B>) => C,
  ): HKT.Kind<
    F,
    TC,
    HKT.Mix<F, "K", [K, K1]>,
    HKT.Mix<F, "Q", [Q, Q1]>,
    HKT.Mix<F, "W", [W, W1]>,
    HKT.Mix<F, "X", [X, X1]>,
    HKT.Mix<F, "I", [I, I1]>,
    HKT.Mix<F, "S", [S, S1]>,
    HKT.Mix<F, "R", [R, R1]>,
    HKT.Mix<F, "E", [E, E1]>,
    C
  >;
}

export interface alignWith<F extends HKT, TC = HKT.None> {
  <A, K1, Q1, W1, X1, I1, S1, R1, E1, B, C>(
    fb: HKT.Kind<F, TC, K1, Q1, W1, X1, I1, S1, R1, E1, B>,
    f: (th: These<A, B>) => C,
  ): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<
      F,
      TC,
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
    TC,
    HKT.Mix<F, "K", [K1, K]>,
    HKT.Mix<F, "Q", [Q1, Q]>,
    HKT.Mix<F, "W", [W1, W]>,
    HKT.Mix<F, "X", [X1, X]>,
    HKT.Mix<F, "I", [I1, I]>,
    HKT.Mix<F, "S", [S1, S]>,
    HKT.Mix<F, "R", [R1, R]>,
    HKT.Mix<F, "E", [E1, E]>,
    C
  >;
}

export function alignWithF_<F extends HKT, C = HKT.None>(F: SemialignMin<F, C>): alignWith_<F, C> {
  if ("alignWith_" in F) {
    return F.alignWith_;
  } else {
    return (fa, fb, f) => F.map_(F.align_(fa, fb), f);
  }
}

export interface alignCombine_<F extends HKT, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, K1, Q1, W1, X1, I1, S1, R1, E1, A>(
    fa1: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    fa2: HKT.Kind<
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
      A
    >,
    /** @tsplus auto */ S: Semigroup<A>,
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
    A
  >;
}

export interface alignCombine<F extends HKT, C = HKT.None> {
  <A>(S: Semigroup<A>): <K1, Q1, W1, X1, I1, S1, R1, E1>(
    fb: HKT.Kind<F, C, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
  ) => <K, Q, W, X, I, S, R, E>(
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
    A
  >;
}

export function alignCombineF_<F extends HKT, C = HKT.None>(F: SemialignMin<F, C>): alignCombine_<F, C> {
  const alignWith_ = alignWithF_(F);
  return (fa1, fa2, S) => alignWith_(fa1, fa2, (th) => th.match(identity, identity, S.combine));
}

export function alignCombineF<F extends HKT, C = HKT.None>(F: SemialignMin<F, C>): alignCombine<F, C>;
export function alignCombineF<F>(F: SemialignMin<HKT.F<F>>): alignCombine<HKT.F<F>> {
  return (S) => (fb) => (fa) => alignCombineF_(F)(fa, fb, S);
}

export interface padZip_<F extends HKT, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    fb: HKT.Kind<
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
      B
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
    readonly [Maybe<A>, Maybe<B>]
  >;
}

export interface padZip<F extends HKT, C = HKT.None> {
  <K1, Q1, W1, X1, I1, S1, R1, E1, B>(fb: HKT.Kind<F, C, K1, Q1, W1, X1, I1, S1, R1, E1, B>): <
    K,
    Q,
    W,
    X,
    I,
    S,
    R,
    E,
    A,
  >(
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
    readonly [Maybe<A>, Maybe<B>]
  >;
}

export function padZipF_<F extends HKT, C = HKT.None>(F: SemialignMin<F, C>): padZip_<F, C> {
  const padZipWith_ = padZipWithF_(F);
  return (fa, fb) => padZipWith_(fa, fb, identity);
}

export function padZipF<F extends HKT, C = HKT.None>(F: SemialignMin<F, C>): padZip<F, C>;
export function padZipF<F>(F: SemialignMin<HKT.F<F>>): padZip<HKT.F<F>> {
  return (fb) => (fa) => padZipF_(F)(fa, fb);
}

export interface padZipWith_<F extends HKT, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B, D>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    fb: HKT.Kind<
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
      B
    >,
    f: (_: readonly [Maybe<A>, Maybe<B>]) => D,
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
    D
  >;
}

export interface padZipWith<F extends HKT, C = HKT.None> {
  <A, K1, Q1, W1, X1, I1, S1, R1, E1, B, D>(
    fb: HKT.Kind<F, C, K1, Q1, W1, X1, I1, S1, R1, E1, B>,
    f: (_: readonly [Maybe<A>, Maybe<B>]) => D,
  ): <K, Q, W, X, I, S, R, E>(
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
    D
  >;
}

export function padZipWithF_<F extends HKT, C = HKT.None>(F: SemialignMin<F, C>): padZipWith_<F, C> {
  const alignWith_ = alignWithF_(F);
  return (fa, fb, f) =>
    alignWith_(fa, fb, (th) =>
      th.match(
        (a) => f([Just(a), Nothing()]),
        (b) => f([Nothing(), Just(b)]),
        (a, b) => f([Just(a), Just(b)]),
      ),
    );
}

export function padZipWithF<F extends HKT, C = HKT.None>(F: SemialignMin<F, C>): padZipWith<F, C>;
export function padZipWithF<F>(F: SemialignMin<HKT.F<F>>): padZipWith<HKT.F<F>> {
  return (fb, f) => (fa) => padZipWithF_(F)(fa, fb, f);
}

export interface zipAll_<F extends HKT, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    fb: HKT.Kind<
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
      B
    >,
    a: A,
    b: B,
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
    readonly [A, B]
  >;
}

export interface zipAll<F extends HKT, C = HKT.None> {
  <A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(fb: HKT.Kind<F, C, K1, Q1, W1, X1, I1, S1, R1, E1, B>, a: A, b: B): <
    K,
    Q,
    W,
    X,
    I,
    S,
    R,
    E,
  >(
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
    readonly [A, B]
  >;
}

export function zipAllF_<F extends HKT, C = HKT.None>(F: SemialignMin<F, C>): zipAll_<F, C> {
  const alignWith_ = alignWithF_(F);
  return (fa, fb, a, b) =>
    alignWith_(fa, fb, (th) =>
      th.match(
        (x) => [x, b],
        (x) => [a, x],
        tuple,
      ),
    );
}

export function zipAllF<F extends HKT, C = HKT.None>(F: SemialignMin<F, C>): zipAll<F, C>;
export function zipAllF<F>(F: SemialignMin<HKT.F<F>>): zipAll<HKT.F<F>> {
  return (fb, a, b) => (fa) => zipAllF_(F)(fa, fb, a, b);
}
