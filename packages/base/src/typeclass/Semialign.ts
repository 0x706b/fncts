import type { Functor } from "@fncts/base/typeclass/Functor";
import type { Semigroup } from "@fncts/base/typeclass/Semigroup";

import { identity, tuple } from "@fncts/base/data/function";

/**
 * @tsplus type fncts.Semialign
 */
export interface Semialign<F extends HKT> extends Functor<F> {
  readonly alignWith: alignWith<F>;
}

/**
 * @tsplus type fncts.SemialignOps
 */
export interface SemialignOps {}

export const Semialign: SemialignOps = {};

export interface align<F extends HKT> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    fb: HKT.Kind<
      F,
      HKT.Intro<"K", K, K1>,
      HKT.Intro<"Q", Q, Q1>,
      HKT.Intro<"W", W, W1>,
      HKT.Intro<"X", X, X1>,
      HKT.Intro<"I", I, I1>,
      HKT.Intro<"S", S, S1>,
      HKT.Intro<"R", R, R1>,
      HKT.Intro<"E", E, E1>,
      B
    >,
  ): HKT.Kind<
    F,
    HKT.Mix<"K", [K, K1]>,
    HKT.Mix<"Q", [Q, Q1]>,
    HKT.Mix<"W", [W, W1]>,
    HKT.Mix<"X", [X, X1]>,
    HKT.Mix<"I", [I, I1]>,
    HKT.Mix<"S", [S, S1]>,
    HKT.Mix<"R", [R, R1]>,
    HKT.Mix<"E", [E, E1]>,
    These<A, B>
  >;
}

/**
 * @tsplus fluent fncts.Kind align
 */
export function align<F extends HKT, K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  fb: HKT.Kind<
    F,
    HKT.Intro<"K", K, K1>,
    HKT.Intro<"Q", Q, Q1>,
    HKT.Intro<"W", W, W1>,
    HKT.Intro<"X", X, X1>,
    HKT.Intro<"I", I, I1>,
    HKT.Intro<"S", S, S1>,
    HKT.Intro<"R", R, R1>,
    HKT.Intro<"E", E, E1>,
    B
  >,
  /** @tsplus auto */ F: Semialign<F>,
): HKT.Kind<
  F,
  HKT.Mix<"K", [K, K1]>,
  HKT.Mix<"Q", [Q, Q1]>,
  HKT.Mix<"W", [W, W1]>,
  HKT.Mix<"X", [X, X1]>,
  HKT.Mix<"I", [I, I1]>,
  HKT.Mix<"S", [S, S1]>,
  HKT.Mix<"R", [R, R1]>,
  HKT.Mix<"E", [E, E1]>,
  These<A, B>
> {
  return F.alignWith(fa, fb, identity);
}

export interface alignWith<F extends HKT> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B, C>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    fb: HKT.Kind<
      F,
      HKT.Intro<"K", K, K1>,
      HKT.Intro<"Q", Q, Q1>,
      HKT.Intro<"W", W, W1>,
      HKT.Intro<"X", X, X1>,
      HKT.Intro<"I", I, I1>,
      HKT.Intro<"S", S, S1>,
      HKT.Intro<"R", R, R1>,
      HKT.Intro<"E", E, E1>,
      B
    >,
    f: (th: These<A, B>) => C,
  ): HKT.Kind<
    F,
    HKT.Mix<"K", [K, K1]>,
    HKT.Mix<"Q", [Q, Q1]>,
    HKT.Mix<"W", [W, W1]>,
    HKT.Mix<"X", [X, X1]>,
    HKT.Mix<"I", [I, I1]>,
    HKT.Mix<"S", [S, S1]>,
    HKT.Mix<"R", [R, R1]>,
    HKT.Mix<"E", [E, E1]>,
    C
  >;
}

/**
 * @tsplus fluent fncts.Kind alignWith
 */
export function alignWith<F extends HKT, K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B, C>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  fb: HKT.Kind<
    F,
    HKT.Intro<"K", K, K1>,
    HKT.Intro<"Q", Q, Q1>,
    HKT.Intro<"W", W, W1>,
    HKT.Intro<"X", X, X1>,
    HKT.Intro<"I", I, I1>,
    HKT.Intro<"S", S, S1>,
    HKT.Intro<"R", R, R1>,
    HKT.Intro<"E", E, E1>,
    B
  >,
  f: (th: These<A, B>) => C,
  /** @tsplus auto */ F: Semialign<F>,
): HKT.Kind<
  F,
  HKT.Mix<"K", [K, K1]>,
  HKT.Mix<"Q", [Q, Q1]>,
  HKT.Mix<"W", [W, W1]>,
  HKT.Mix<"X", [X, X1]>,
  HKT.Mix<"I", [I, I1]>,
  HKT.Mix<"S", [S, S1]>,
  HKT.Mix<"R", [R, R1]>,
  HKT.Mix<"E", [E, E1]>,
  C
> {
  return fa.alignWith(fb, f, F);
}

export interface alignCombine<F extends HKT> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1>(
    self: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    that: HKT.Kind<
      F,
      HKT.Intro<"K", K, K1>,
      HKT.Intro<"Q", Q, Q1>,
      HKT.Intro<"W", W, W1>,
      HKT.Intro<"X", X, X1>,
      HKT.Intro<"I", I, I1>,
      HKT.Intro<"S", S, S1>,
      HKT.Intro<"R", R, R1>,
      HKT.Intro<"E", E, E1>,
      A
    >,
    S: Semigroup<A>,
  ): HKT.Kind<
    F,
    HKT.Mix<"K", [K, K1]>,
    HKT.Mix<"Q", [Q, Q1]>,
    HKT.Mix<"W", [W, W1]>,
    HKT.Mix<"X", [X, X1]>,
    HKT.Mix<"I", [I, I1]>,
    HKT.Mix<"S", [S, S1]>,
    HKT.Mix<"R", [R, R1]>,
    HKT.Mix<"E", [E, E1]>,
    A
  >;
}

/**
 * @tsplus fluent fncts.Kind alignCombine
 */
export function alignCombine<F extends HKT, K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1>(
  self: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  that: HKT.Kind<
    F,
    HKT.Intro<"K", K, K1>,
    HKT.Intro<"Q", Q, Q1>,
    HKT.Intro<"W", W, W1>,
    HKT.Intro<"X", X, X1>,
    HKT.Intro<"I", I, I1>,
    HKT.Intro<"S", S, S1>,
    HKT.Intro<"R", R, R1>,
    HKT.Intro<"E", E, E1>,
    A
  >,
  /** @tsplus auto */ F: Semialign<F>,
  /** @tsplus auto */ S: Semigroup<A>,
): HKT.Kind<
  F,
  HKT.Mix<"K", [K, K1]>,
  HKT.Mix<"Q", [Q, Q1]>,
  HKT.Mix<"W", [W, W1]>,
  HKT.Mix<"X", [X, X1]>,
  HKT.Mix<"I", [I, I1]>,
  HKT.Mix<"S", [S, S1]>,
  HKT.Mix<"R", [R, R1]>,
  HKT.Mix<"E", [E, E1]>,
  A
> {
  return self.alignWith(that, (th) => th.match(identity, identity, S.combine));
}

export interface padZip<F extends HKT> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    fb: HKT.Kind<
      F,
      HKT.Intro<"K", K, K1>,
      HKT.Intro<"Q", Q, Q1>,
      HKT.Intro<"W", W, W1>,
      HKT.Intro<"X", X, X1>,
      HKT.Intro<"I", I, I1>,
      HKT.Intro<"S", S, S1>,
      HKT.Intro<"R", R, R1>,
      HKT.Intro<"E", E, E1>,
      B
    >,
  ): HKT.Kind<
    F,
    HKT.Mix<"K", [K, K1]>,
    HKT.Mix<"Q", [Q, Q1]>,
    HKT.Mix<"W", [W, W1]>,
    HKT.Mix<"X", [X, X1]>,
    HKT.Mix<"I", [I, I1]>,
    HKT.Mix<"S", [S, S1]>,
    HKT.Mix<"R", [R, R1]>,
    HKT.Mix<"E", [E, E1]>,
    readonly [Maybe<A>, Maybe<B>]
  >;
}

/**
 * @tsplus fluent fncts.Kind padZip
 */
export function padZip<F extends HKT, K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  fb: HKT.Kind<
    F,
    HKT.Intro<"K", K, K1>,
    HKT.Intro<"Q", Q, Q1>,
    HKT.Intro<"W", W, W1>,
    HKT.Intro<"X", X, X1>,
    HKT.Intro<"I", I, I1>,
    HKT.Intro<"S", S, S1>,
    HKT.Intro<"R", R, R1>,
    HKT.Intro<"E", E, E1>,
    B
  >,
  /** @tsplus auto */ F: Semialign<F>,
): HKT.Kind<
  F,
  HKT.Mix<"K", [K, K1]>,
  HKT.Mix<"Q", [Q, Q1]>,
  HKT.Mix<"W", [W, W1]>,
  HKT.Mix<"X", [X, X1]>,
  HKT.Mix<"I", [I, I1]>,
  HKT.Mix<"S", [S, S1]>,
  HKT.Mix<"R", [R, R1]>,
  HKT.Mix<"E", [E, E1]>,
  readonly [Maybe<A>, Maybe<B>]
> {
  return fa.padZipWith(fb, identity);
}

export interface padZipWith<F extends HKT> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B, D>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    fb: HKT.Kind<
      F,
      HKT.Intro<"K", K, K1>,
      HKT.Intro<"Q", Q, Q1>,
      HKT.Intro<"W", W, W1>,
      HKT.Intro<"X", X, X1>,
      HKT.Intro<"I", I, I1>,
      HKT.Intro<"S", S, S1>,
      HKT.Intro<"R", R, R1>,
      HKT.Intro<"E", E, E1>,
      B
    >,
    f: (_: readonly [Maybe<A>, Maybe<B>]) => D,
  ): HKT.Kind<
    F,
    HKT.Mix<"K", [K, K1]>,
    HKT.Mix<"Q", [Q, Q1]>,
    HKT.Mix<"W", [W, W1]>,
    HKT.Mix<"X", [X, X1]>,
    HKT.Mix<"I", [I, I1]>,
    HKT.Mix<"S", [S, S1]>,
    HKT.Mix<"R", [R, R1]>,
    HKT.Mix<"E", [E, E1]>,
    D
  >;
}

/**
 * @tsplus fluent fncts.Kind padZipWith
 */
export function padZipWith<F extends HKT, K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B, D>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  fb: HKT.Kind<
    F,
    HKT.Intro<"K", K, K1>,
    HKT.Intro<"Q", Q, Q1>,
    HKT.Intro<"W", W, W1>,
    HKT.Intro<"X", X, X1>,
    HKT.Intro<"I", I, I1>,
    HKT.Intro<"S", S, S1>,
    HKT.Intro<"R", R, R1>,
    HKT.Intro<"E", E, E1>,
    B
  >,
  f: (_: readonly [Maybe<A>, Maybe<B>]) => D,
  /** @tsplus auto */ F: Semialign<F>,
): HKT.Kind<
  F,
  HKT.Mix<"K", [K, K1]>,
  HKT.Mix<"Q", [Q, Q1]>,
  HKT.Mix<"W", [W, W1]>,
  HKT.Mix<"X", [X, X1]>,
  HKT.Mix<"I", [I, I1]>,
  HKT.Mix<"S", [S, S1]>,
  HKT.Mix<"R", [R, R1]>,
  HKT.Mix<"E", [E, E1]>,
  D
> {
  return fa.alignWith(fb, (th) =>
    th.match(
      (a) => f([Just(a), Nothing()]),
      (b) => f([Nothing(), Just(b)]),
      (a, b) => f([Just(a), Just(b)]),
    ),
  );
}

export interface zipAll<F extends HKT> {
  <K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
    fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
    fb: HKT.Kind<
      F,
      HKT.Intro<"K", K, K1>,
      HKT.Intro<"Q", Q, Q1>,
      HKT.Intro<"W", W, W1>,
      HKT.Intro<"X", X, X1>,
      HKT.Intro<"I", I, I1>,
      HKT.Intro<"S", S, S1>,
      HKT.Intro<"R", R, R1>,
      HKT.Intro<"E", E, E1>,
      B
    >,
    a: A,
    b: B,
  ): HKT.Kind<
    F,
    HKT.Mix<"K", [K, K1]>,
    HKT.Mix<"Q", [Q, Q1]>,
    HKT.Mix<"W", [W, W1]>,
    HKT.Mix<"X", [X, X1]>,
    HKT.Mix<"I", [I, I1]>,
    HKT.Mix<"S", [S, S1]>,
    HKT.Mix<"R", [R, R1]>,
    HKT.Mix<"E", [E, E1]>,
    readonly [A, B]
  >;
}

/**
 * @tsplus fluent fncts.Kind zipAll
 */
export function zipAll<F extends HKT, K, Q, W, X, I, S, R, E, A, K1, Q1, W1, X1, I1, S1, R1, E1, B>(
  fa: HKT.Kind<F, K, Q, W, X, I, S, R, E, A>,
  fb: HKT.Kind<
    F,
    HKT.Intro<"K", K, K1>,
    HKT.Intro<"Q", Q, Q1>,
    HKT.Intro<"W", W, W1>,
    HKT.Intro<"X", X, X1>,
    HKT.Intro<"I", I, I1>,
    HKT.Intro<"S", S, S1>,
    HKT.Intro<"R", R, R1>,
    HKT.Intro<"E", E, E1>,
    B
  >,
  a: A,
  b: B,
  /** @tsplus auto */ F: Semialign<F>,
): HKT.Kind<
  F,
  HKT.Mix<"K", [K, K1]>,
  HKT.Mix<"Q", [Q, Q1]>,
  HKT.Mix<"W", [W, W1]>,
  HKT.Mix<"X", [X, X1]>,
  HKT.Mix<"I", [I, I1]>,
  HKT.Mix<"S", [S, S1]>,
  HKT.Mix<"R", [R, R1]>,
  HKT.Mix<"E", [E, E1]>,
  readonly [A, B]
> {
  return fa.alignWith(fb, (th) =>
    th.match(
      (x) => [x, b],
      (x) => [a, x],
      tuple,
    ),
  );
}
