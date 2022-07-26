import type { Functor } from "@fncts/base/typeclass/Functor";
import type { Semigroup } from "@fncts/base/typeclass/Semigroup";

import { identity, tuple } from "@fncts/base/data/function";

/**
 * @tsplus type fncts.Semialign
 */
export interface Semialign<F extends HKT, FC = HKT.None> extends Functor<F, FC> {
  readonly alignWith: alignWith<F, FC>;
}

/**
 * @tsplus type fncts.SemialignOps
 */
export interface SemialignOps {}

export const Semialign: SemialignOps = {};

export interface align<F extends HKT, FC = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    fb: HKT.Kind<
      F,
      FC,
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
    FC,
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

/**
 * @tsplus static fncts.SemialignOps align
 */
export function align<F extends HKT, FC = HKT.None>(
  F: Semialign<F, FC>,
): <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
  fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  fb: HKT.Kind<
    F,
    FC,
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
) => HKT.Kind<
  F,
  FC,
  HKT.Mix<F, "K", [K, K1]>,
  HKT.Mix<F, "Q", [Q, Q1]>,
  HKT.Mix<F, "W", [W, W1]>,
  HKT.Mix<F, "X", [X, X1]>,
  HKT.Mix<F, "I", [I, I1]>,
  HKT.Mix<F, "S", [S, S1]>,
  HKT.Mix<F, "R", [R, R1]>,
  HKT.Mix<F, "E", [E, E1]>,
  These<A, B>
> {
  return (fa, fb) => F.alignWith(fa, fb, identity);
}

export interface alignWith<F extends HKT, FC = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B, C>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    fb: HKT.Kind<
      F,
      FC,
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
    FC,
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

/**
 * @tsplus static fncts.SemialignOps alignWith
 */
export function alignWith<F extends HKT, FC = HKT.None>(
  F: Semialign<F, FC>,
): <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B, C>(
  fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  fb: HKT.Kind<
    F,
    FC,
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
) => HKT.Kind<
  F,
  FC,
  HKT.Mix<F, "K", [K, K1]>,
  HKT.Mix<F, "Q", [Q, Q1]>,
  HKT.Mix<F, "W", [W, W1]>,
  HKT.Mix<F, "X", [X, X1]>,
  HKT.Mix<F, "I", [I, I1]>,
  HKT.Mix<F, "S", [S, S1]>,
  HKT.Mix<F, "R", [R, R1]>,
  HKT.Mix<F, "E", [E, E1]>,
  C
> {
  return (fa, fb, f) => F.alignWith(fa, fb, f);
}

export interface alignCombine<F extends HKT, FC = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1>(
    self: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    that: HKT.Kind<
      F,
      FC,
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
    S: Semigroup<A>,
  ): HKT.Kind<
    F,
    FC,
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

/**
 * @tsplus static fncts.SemialignOps alignCombine
 */
export function alignCombine<F extends HKT, FC = HKT.None>(
  F: Semialign<F, FC>,
): <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1>(
  self: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  that: HKT.Kind<
    F,
    FC,
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
) => HKT.Kind<
  F,
  FC,
  HKT.Mix<F, "K", [K, K1]>,
  HKT.Mix<F, "Q", [Q, Q1]>,
  HKT.Mix<F, "W", [W, W1]>,
  HKT.Mix<F, "X", [X, X1]>,
  HKT.Mix<F, "I", [I, I1]>,
  HKT.Mix<F, "S", [S, S1]>,
  HKT.Mix<F, "R", [R, R1]>,
  HKT.Mix<F, "E", [E, E1]>,
  A
> {
  return (self, that, S) => F.alignWith(self, that, (th) => th.match(identity, identity, S.combine));
}

export interface padZip<F extends HKT, FC = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    fb: HKT.Kind<
      F,
      FC,
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
    FC,
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

/**
 * @tsplus fluent fncts.Kind padZip
 */
export function padZip<F extends HKT, FC = HKT.None>(
  F: Semialign<F, FC>,
): <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
  fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  fb: HKT.Kind<
    F,
    FC,
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
) => HKT.Kind<
  F,
  FC,
  HKT.Mix<F, "K", [K, K1]>,
  HKT.Mix<F, "Q", [Q, Q1]>,
  HKT.Mix<F, "W", [W, W1]>,
  HKT.Mix<F, "X", [X, X1]>,
  HKT.Mix<F, "I", [I, I1]>,
  HKT.Mix<F, "S", [S, S1]>,
  HKT.Mix<F, "R", [R, R1]>,
  HKT.Mix<F, "E", [E, E1]>,
  readonly [Maybe<A>, Maybe<B>]
> {
  return (fa, fb) => Semialign.padZipWith(F)(fa, fb, identity);
}

export interface padZipWith<F extends HKT, FC = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B, D>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    fb: HKT.Kind<
      F,
      FC,
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
    FC,
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

/**
 * @tsplus static fncts.SemialignOps padZipWith
 */
export function padZipWith<F extends HKT, FC = HKT.None>(
  F: Semialign<F, FC>,
): <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B, D>(
  fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  fb: HKT.Kind<
    F,
    FC,
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
) => HKT.Kind<
  F,
  FC,
  HKT.Mix<F, "K", [K, K1]>,
  HKT.Mix<F, "Q", [Q, Q1]>,
  HKT.Mix<F, "W", [W, W1]>,
  HKT.Mix<F, "X", [X, X1]>,
  HKT.Mix<F, "I", [I, I1]>,
  HKT.Mix<F, "S", [S, S1]>,
  HKT.Mix<F, "R", [R, R1]>,
  HKT.Mix<F, "E", [E, E1]>,
  D
> {
  return (fa, fb, f) =>
    F.alignWith(fa, fb, (th) =>
      th.match(
        (a) => f([Just(a), Nothing()]),
        (b) => f([Nothing(), Just(b)]),
        (a, b) => f([Just(a), Just(b)]),
      ),
    );
}

export interface zipAll<F extends HKT, FC = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    fb: HKT.Kind<
      F,
      FC,
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
    FC,
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

/**
 * @tsplus static fncts.SemialignOps zipAll
 */
export function zipAll<F extends HKT, FC = HKT.None>(
  F: Semialign<F, FC>,
): <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
  fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  fb: HKT.Kind<
    F,
    FC,
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
) => HKT.Kind<
  F,
  FC,
  HKT.Mix<F, "K", [K, K1]>,
  HKT.Mix<F, "Q", [Q, Q1]>,
  HKT.Mix<F, "W", [W, W1]>,
  HKT.Mix<F, "X", [X, X1]>,
  HKT.Mix<F, "I", [I, I1]>,
  HKT.Mix<F, "S", [S, S1]>,
  HKT.Mix<F, "R", [R, R1]>,
  HKT.Mix<F, "E", [E, E1]>,
  readonly [A, B]
> {
  return (fa, fb, a, b) =>
    F.alignWith(fa, fb, (th) =>
      th.match(
        (x) => [x, b],
        (x) => [a, x],
        tuple,
      ),
    );
}
