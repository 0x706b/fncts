import type * as Union from "./Union.js";

export namespace HKT {
  export declare const F: unique symbol;
  export type F = typeof F;
  export declare const K: unique symbol;
  export type K = typeof K;
  export declare const Q: unique symbol;
  export type Q = typeof Q;
  export declare const W: unique symbol;
  export type W = typeof W;
  export declare const X: unique symbol;
  export type X = typeof X;
  export declare const I: unique symbol;
  export type I = typeof I;
  export declare const S: unique symbol;
  export type S = typeof S;
  export declare const R: unique symbol;
  export type R = typeof R;
  export declare const E: unique symbol;
  export type E = typeof E;
  export declare const A: unique symbol;
  export type A = typeof A;
  export declare const T: unique symbol;
  export type T = typeof T;
  export declare const Ix: unique symbol;
  export type Ix = typeof Ix;
  export declare const C: unique symbol;
  export type C = typeof C;

  export type _K<X extends HKT> = X extends { [K]?: () => infer K } ? K : never;
  export type _Q<X extends HKT> = X extends { [Q]?: (_: infer Q) => void } ? Q : never;
  export type _W<X extends HKT> = X extends { [W]?: () => infer W } ? W : never;
  export type _X<X extends HKT> = X extends { [X]?: () => infer X } ? X : never;
  export type _I<X extends HKT> = X extends { [I]?: (_: infer I) => void } ? I : never;
  export type _S<X extends HKT> = X extends { [S]?: () => infer S } ? S : never;
  export type _R<X extends HKT> = X extends { [R]?: (_: infer R) => void } ? R : never;
  export type _E<X extends HKT> = X extends { [E]?: () => infer E } ? E : never;
  export type _A<X extends HKT> = [X] extends [{ [A]?: () => infer A }] ? A : never;

  export type _Ix<X extends HKT> = X extends { [Ix]?: infer Ix } ? Ix : never;

  export type IndexFor<X extends HKT, K> = X extends { [Ix]?: infer Ix } ? Ix : K;

  /**
   * @tsplus type fncts.Kind
   */
  export type Kind<F extends HKT, K, Q, W, X, I, S, R, E, A> = F & {
    [F]?: F;
    [K]?: () => K;
    [Q]?: (_: Q) => void;
    [W]?: () => W;
    [X]?: () => X;
    [I]?: (_: I) => void;
    [S]?: () => S;
    [R]?: (_: R) => void;
    [E]?: () => E;
    [A]?: () => A;
  } extends { [T]?: infer X }
    ? X
    : {
        [F]?: F;
        [K]?: () => K;
        [Q]?: (_: Q) => void;
        [W]?: () => W;
        [X]?: () => X;
        [I]?: (_: I) => void;
        [S]?: () => S;
        [R]?: (_: R) => void;
        [E]?: () => E;
        [A]?: () => A;
      };

  /**
   * @tsplus type fncts.Typeclass
   */
  export interface Typeclass<F extends HKT> {
    [HKT.F]?: F;
  }

  export type ParamName = "K" | "Q" | "W" | "X" | "I" | "S" | "R" | "E" | "A";

  export type Mix<N extends ParamName, P extends ReadonlyArray<unknown>> = VarianceToMix<P>[ParamToVariance[N]];

  export type MixStruct<N extends ParamName, X, Y> = ParamToVariance[N] extends "_"
    ? X
    : ParamToVariance[N] extends "+"
    ? Y[keyof Y]
    : ParamToVariance[N] extends "-"
    ? Union.IntersectionOf<{ [K in keyof Y]: OrNever<Y[K]> }[keyof Y]>
    : X;

  export type Intro<N extends ParamName, A, B> = VarianceToIntro<A, B>[ParamToVariance[N]];

  export type Low<N extends ParamName> = VarianceToLow[ParamToVariance[N]];

  export type Infer<F extends HKT, N extends ParamName, K> = [K] extends [
    Kind<F, infer K, infer Q, infer W, infer X, infer I, infer S, infer R, infer E, infer A>,
  ]
    ? N extends "K"
      ? K
      : N extends "Q"
      ? Q
      : N extends "W"
      ? W
      : N extends "X"
      ? X
      : N extends "I"
      ? I
      : N extends "S"
      ? S
      : N extends "R"
      ? R
      : N extends "E"
      ? E
      : N extends "A"
      ? A
      : never
    : never;

  export type ErasedKind<F extends HKT> = HKT.Kind<F, any, any, any, any, any, any, any, any, any>;
}

export interface HKT {
  [HKT.F]?: HKT;
  [HKT.K]?: () => unknown;
  [HKT.Q]?: (_: never) => void;
  [HKT.W]?: () => unknown;
  [HKT.X]?: () => unknown;
  [HKT.I]?: (_: never) => void;
  [HKT.S]?: () => unknown;
  [HKT.R]?: (_: never) => void;
  [HKT.E]?: () => unknown;
  [HKT.A]?: () => unknown;
  [HKT.T]?: unknown;
  [HKT.Ix]?: unknown;
}

interface VarianceToMix<P extends ReadonlyArray<unknown>> {
  "-": P extends [any]
    ? P[0]
    : P extends [any, any]
    ? P[0] & P[1]
    : P extends [any, any, any]
    ? P[0] & P[1] & P[2]
    : P extends [any, any, any, any]
    ? P[0] & P[1] & P[2] & P[3]
    : P extends [any, any, any, any, any]
    ? P[0] & P[1] & P[2] & P[3] & P[4]
    : Union.IntersectionOf<P[number]>;
  "+": P[number];
  _: P[0];
}

interface VarianceToIntro<A, B> {
  "-": B;
  "+": B;
  _: A;
}

interface VarianceToLow {
  "-": unknown;
  "+": never;
  _: any;
}

interface ParamToVariance {
  K: "_";
  Q: "-";
  W: "+";
  X: "+";
  I: "_";
  S: "_";
  R: "-";
  E: "+";
  A: "+";
}

type OrNever<K> = unknown extends K ? never : K;

declare const Fix: unique symbol;
