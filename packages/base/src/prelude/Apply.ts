import type { FunctorMin } from "@fncts/base/prelude/Functor";
import type { Semimonoidal } from "@fncts/base/prelude/Semimonoidal";
import type { Object } from "@fncts/typelevel";

import { tuple } from "@fncts/base/data/function";
import { Functor } from "@fncts/base/prelude/Functor";

/**
 * @tsplus type fncts.Apply
 */
export interface Apply<F extends HKT, FC = HKT.None> extends Semimonoidal<F, FC>, Functor<F, FC> {
  readonly ap_: ap_<F, FC>;
  readonly ap: ap<F, FC>;
  readonly apFirst_: apFirst_<F, FC>;
  readonly apFirst: apFirst<F, FC>;
  readonly apSecond_: apSecond_<F, FC>;
  readonly apSecond: apSecond<F, FC>;
  readonly zipWith_: zipWith_<F, FC>;
  readonly zipWith: zipWith<F, FC>;
}

/**
 * @tsplus type fncts.ApplyOps
 */
export interface ApplyOps {}

export const Apply: ApplyOps = {};

export type ApplyMin<F extends HKT, FC = HKT.None> = {
  readonly ap_: ap_<F, FC>;
  zipWith_: zipWith_<F, FC>;
} & FunctorMin<F, FC>;

/**
 * @tsplus static fncts.ApplyOps __call
 */
export function mkApply<F extends HKT, FC = HKT.None>(F: ApplyMin<F, FC>): Apply<F, FC>;
export function mkApply<F>(F: ApplyMin<HKT.F<F>>): Apply<HKT.F<F>> {
  const apFirst_: apFirst_<HKT.F<F>>   = (fa, fb) => F.zipWith_(fa, fb, (a, _) => a);
  const apSecond_: apSecond_<HKT.F<F>> = (fa, fb) => F.zipWith_(fa, fb, (_, b) => b);
  return HKT.instance<Apply<HKT.F<F>>>({
    ...Functor(F),
    ap_: F.ap_,
    ap: (fa) => (fab) => F.ap_(fab, fa),
    apFirst_,
    apFirst: (fb) => (fa) => apFirst_(fa, fb),
    apSecond_,
    apSecond: (fb) => (fa) => apSecond_(fa, fb),
    zipWith_: F.zipWith_,
    zipWith: (fb, f) => (fa) => F.zipWith_(fa, fb, f),
    zip_: (fa, fb) => F.zipWith_(fa, fb, (a, b) => [a, b]),
    zip: (fb) => (fa) => F.zipWith_(fa, fb, (a, b) => [a, b]),
  });
}

export interface ap_<F extends HKT, FC = HKT.None> {
  <K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
    fab: HKT.Kind<F, FC, K1, Q1, W1, X1, I1, S1, R1, E1, (a: A) => B>,
    fa: HKT.Kind<
      F,
      FC,
      HKT.Intro<F, "K", K1, K2>,
      HKT.Intro<F, "Q", Q1, Q2>,
      HKT.Intro<F, "W", W1, W2>,
      HKT.Intro<F, "X", X1, X2>,
      HKT.Intro<F, "I", I1, I2>,
      HKT.Intro<F, "S", S1, S2>,
      HKT.Intro<F, "R", R1, R2>,
      HKT.Intro<F, "E", E1, E2>,
      A
    >,
  ): HKT.Kind<
    F,
    FC,
    HKT.Mix<F, "K", [K1, K2]>,
    HKT.Mix<F, "Q", [Q1, Q2]>,
    HKT.Mix<F, "W", [W1, W2]>,
    HKT.Mix<F, "X", [X1, X2]>,
    HKT.Mix<F, "I", [I1, I2]>,
    HKT.Mix<F, "S", [S1, S2]>,
    HKT.Mix<F, "R", [R1, R2]>,
    HKT.Mix<F, "E", [E1, E2]>,
    B
  >;
}

export interface ap<F extends HKT, FC = HKT.None> {
  <K1, Q1, W1, X1, I1, S1, R1, E1, A>(fa: HKT.Kind<F, FC, K1, Q1, W1, X1, I1, S1, R1, E1, A>): <
    K2,
    Q2,
    W2,
    X2,
    I2,
    S2,
    R2,
    E2,
    B,
  >(
    fab: HKT.Kind<
      F,
      FC,
      HKT.Intro<F, "K", K1, K2>,
      HKT.Intro<F, "Q", Q1, Q2>,
      HKT.Intro<F, "W", W1, W2>,
      HKT.Intro<F, "X", X1, X2>,
      HKT.Intro<F, "I", I1, I2>,
      HKT.Intro<F, "S", S1, S2>,
      HKT.Intro<F, "R", R1, R2>,
      HKT.Intro<F, "E", E1, E2>,
      (a: A) => B
    >,
  ) => HKT.Kind<
    F,
    FC,
    HKT.Mix<F, "K", [K1, K2]>,
    HKT.Mix<F, "Q", [Q1, Q2]>,
    HKT.Mix<F, "W", [W1, W2]>,
    HKT.Mix<F, "X", [X1, X2]>,
    HKT.Mix<F, "I", [I1, I2]>,
    HKT.Mix<F, "S", [S1, S2]>,
    HKT.Mix<F, "R", [R1, R2]>,
    HKT.Mix<F, "E", [E1, E2]>,
    B
  >;
}

export interface apFirst_<F extends HKT, FC = HKT.None> {
  <K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
    fa: HKT.Kind<F, FC, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
    fb: HKT.Kind<
      F,
      FC,
      HKT.Intro<F, "K", K1, K2>,
      HKT.Intro<F, "Q", Q1, Q2>,
      HKT.Intro<F, "W", W1, W2>,
      HKT.Intro<F, "X", X1, X2>,
      HKT.Intro<F, "I", I1, I2>,
      HKT.Intro<F, "S", S1, S2>,
      HKT.Intro<F, "R", R1, R2>,
      HKT.Intro<F, "E", E1, E2>,
      B
    >,
  ): HKT.Kind<
    F,
    FC,
    HKT.Mix<F, "K", [K1, K2]>,
    HKT.Mix<F, "Q", [Q1, Q2]>,
    HKT.Mix<F, "W", [W1, W2]>,
    HKT.Mix<F, "X", [X1, X2]>,
    HKT.Mix<F, "I", [I1, I2]>,
    HKT.Mix<F, "S", [S1, S2]>,
    HKT.Mix<F, "R", [R1, R2]>,
    HKT.Mix<F, "E", [E1, E2]>,
    A
  >;
}

export interface apFirst<F extends HKT, FC = HKT.None> {
  <K1, Q1, W1, X1, I1, S1, R1, E1, B>(fb: HKT.Kind<F, FC, K1, Q1, W1, X1, I1, S1, R1, E1, B>): <
    K2,
    Q2,
    W2,
    X2,
    I2,
    S2,
    R2,
    E2,
    A,
  >(
    fa: HKT.Kind<
      F,
      FC,
      HKT.Intro<F, "K", K1, K2>,
      HKT.Intro<F, "Q", Q1, Q2>,
      HKT.Intro<F, "W", W1, W2>,
      HKT.Intro<F, "X", X1, X2>,
      HKT.Intro<F, "I", I1, I2>,
      HKT.Intro<F, "S", S1, S2>,
      HKT.Intro<F, "R", R1, R2>,
      HKT.Intro<F, "E", E1, E2>,
      A
    >,
  ) => HKT.Kind<
    F,
    FC,
    HKT.Mix<F, "K", [K1, K2]>,
    HKT.Mix<F, "Q", [Q1, Q2]>,
    HKT.Mix<F, "W", [W1, W2]>,
    HKT.Mix<F, "X", [X1, X2]>,
    HKT.Mix<F, "I", [I1, I2]>,
    HKT.Mix<F, "S", [S1, S2]>,
    HKT.Mix<F, "R", [R1, R2]>,
    HKT.Mix<F, "E", [E1, E2]>,
    A
  >;
}

export interface apSecond_<F extends HKT, FC = HKT.None> {
  <K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
    fa: HKT.Kind<F, FC, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
    fb: HKT.Kind<
      F,
      FC,
      HKT.Intro<F, "K", K1, K2>,
      HKT.Intro<F, "Q", Q1, Q2>,
      HKT.Intro<F, "W", W1, W2>,
      HKT.Intro<F, "X", X1, X2>,
      HKT.Intro<F, "I", I1, I2>,
      HKT.Intro<F, "S", S1, S2>,
      HKT.Intro<F, "R", R1, R2>,
      HKT.Intro<F, "E", E1, E2>,
      B
    >,
  ): HKT.Kind<
    F,
    FC,
    HKT.Mix<F, "K", [K1, K2]>,
    HKT.Mix<F, "Q", [Q1, Q2]>,
    HKT.Mix<F, "W", [W1, W2]>,
    HKT.Mix<F, "X", [X1, X2]>,
    HKT.Mix<F, "I", [I1, I2]>,
    HKT.Mix<F, "S", [S1, S2]>,
    HKT.Mix<F, "R", [R1, R2]>,
    HKT.Mix<F, "E", [E1, E2]>,
    B
  >;
}

export interface apSecond<F extends HKT, FC = HKT.None> {
  <K1, Q1, W1, X1, I1, S1, R1, E1, B>(fb: HKT.Kind<F, FC, K1, Q1, W1, X1, I1, S1, R1, E1, B>): <
    K2,
    Q2,
    W2,
    X2,
    I2,
    S2,
    R2,
    E2,
    A,
  >(
    fa: HKT.Kind<
      F,
      FC,
      HKT.Intro<F, "K", K1, K2>,
      HKT.Intro<F, "Q", Q1, Q2>,
      HKT.Intro<F, "W", W1, W2>,
      HKT.Intro<F, "X", X1, X2>,
      HKT.Intro<F, "I", I1, I2>,
      HKT.Intro<F, "S", S1, S2>,
      HKT.Intro<F, "R", R1, R2>,
      HKT.Intro<F, "E", E1, E2>,
      A
    >,
  ) => HKT.Kind<
    F,
    FC,
    HKT.Mix<F, "K", [K1, K2]>,
    HKT.Mix<F, "Q", [Q1, Q2]>,
    HKT.Mix<F, "W", [W1, W2]>,
    HKT.Mix<F, "X", [X1, X2]>,
    HKT.Mix<F, "I", [I1, I2]>,
    HKT.Mix<F, "S", [S1, S2]>,
    HKT.Mix<F, "R", [R1, R2]>,
    HKT.Mix<F, "E", [E1, E2]>,
    B
  >;
}

export interface zipWith_<F extends HKT, FC = HKT.None> {
  <K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B, C>(
    fa: HKT.Kind<F, FC, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
    fb: HKT.Kind<
      F,
      FC,
      HKT.Intro<F, "K", K1, K2>,
      HKT.Intro<F, "Q", Q1, Q2>,
      HKT.Intro<F, "W", W1, W2>,
      HKT.Intro<F, "X", X1, X2>,
      HKT.Intro<F, "I", I1, I2>,
      HKT.Intro<F, "S", S1, S2>,
      HKT.Intro<F, "R", R1, R2>,
      HKT.Intro<F, "E", E1, E2>,
      B
    >,
    f: (a: A, b: B) => C,
  ): HKT.Kind<
    F,
    FC,
    HKT.Mix<F, "K", [K1, K2]>,
    HKT.Mix<F, "Q", [Q1, Q2]>,
    HKT.Mix<F, "W", [W1, W2]>,
    HKT.Mix<F, "X", [X1, X2]>,
    HKT.Mix<F, "I", [I1, I2]>,
    HKT.Mix<F, "S", [S1, S2]>,
    HKT.Mix<F, "R", [R1, R2]>,
    HKT.Mix<F, "E", [E1, E2]>,
    C
  >;
}

export interface zipWith<F extends HKT, FC = HKT.None> {
  <A, K1, Q1, W1, X1, I1, S1, R1, E1, B, C>(
    fb: HKT.Kind<F, FC, K1, Q1, W1, X1, I1, S1, R1, E1, B>,
    f: (a: A, b: B) => C,
  ): <K2, Q2, W2, X2, I2, S2, R2, E2>(
    fa: HKT.Kind<
      F,
      FC,
      HKT.Intro<F, "K", K1, K2>,
      HKT.Intro<F, "Q", Q1, Q2>,
      HKT.Intro<F, "W", W1, W2>,
      HKT.Intro<F, "X", X1, X2>,
      HKT.Intro<F, "I", I1, I2>,
      HKT.Intro<F, "S", S1, S2>,
      HKT.Intro<F, "R", R1, R2>,
      HKT.Intro<F, "E", E1, E2>,
      A
    >,
  ) => HKT.Kind<
    F,
    FC,
    HKT.Mix<F, "K", [K1, K2]>,
    HKT.Mix<F, "Q", [Q1, Q2]>,
    HKT.Mix<F, "W", [W1, W2]>,
    HKT.Mix<F, "X", [X1, X2]>,
    HKT.Mix<F, "I", [I1, I2]>,
    HKT.Mix<F, "S", [S1, S2]>,
    HKT.Mix<F, "R", [R1, R2]>,
    HKT.Mix<F, "E", [E1, E2]>,
    C
  >;
}

export interface apS_<F extends HKT, FC = HKT.None> {
  <K1, Q1, W1, X1, I1, S1, R1, E1, A, BN extends string, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
    fa: HKT.Kind<F, FC, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
    name: Exclude<BN, keyof A>,
    fb: HKT.Kind<
      F,
      FC,
      HKT.Intro<F, "K", K1, K2>,
      HKT.Intro<F, "Q", Q1, Q2>,
      HKT.Intro<F, "W", W1, W2>,
      HKT.Intro<F, "X", X1, X2>,
      HKT.Intro<F, "I", I1, I2>,
      HKT.Intro<F, "S", S1, S2>,
      HKT.Intro<F, "R", R1, R2>,
      HKT.Intro<F, "E", E1, E2>,
      B
    >,
  ): HKT.Kind<
    F,
    FC,
    HKT.Mix<F, "K", [K1, K2]>,
    HKT.Mix<F, "Q", [Q1, Q2]>,
    HKT.Mix<F, "W", [W1, W2]>,
    HKT.Mix<F, "X", [X1, X2]>,
    HKT.Mix<F, "I", [I1, I2]>,
    HKT.Mix<F, "S", [S1, S2]>,
    HKT.Mix<F, "R", [R1, R2]>,
    HKT.Mix<F, "E", [E1, E2]>,
    { [K in keyof A | BN]: K extends keyof A ? A[K] : B }
  >;
}

export interface apS<F extends HKT, FC = HKT.None> {
  <BN extends string, K1, Q1, W1, X1, I1, S1, R1, E1, A1, A>(
    name: Exclude<BN, keyof A>,
    fb: HKT.Kind<F, FC, K1, Q1, W1, X1, I1, S1, R1, E1, A1>,
  ): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<
      F,
      FC,
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
    FC,
    HKT.Mix<F, "K", [K1, K]>,
    HKT.Mix<F, "Q", [Q1, Q]>,
    HKT.Mix<F, "W", [W1, W]>,
    HKT.Mix<F, "X", [X1, X]>,
    HKT.Mix<F, "I", [I1, I]>,
    HKT.Mix<F, "S", [S1, S]>,
    HKT.Mix<F, "R", [R1, R]>,
    HKT.Mix<F, "E", [E1, E]>,
    { [K in keyof A | BN]: K extends keyof A ? A[K] : A1 }
  >;
}

export interface sequenceS<F extends HKT, FC = HKT.None> {
  <
    KS extends Readonly<
      Record<
        string,
        HKT.Kind<
          F,
          FC,
          HKT.Intro<F, "K", K, any>,
          HKT.Intro<F, "Q", Q, any>,
          HKT.Intro<F, "W", W, any>,
          HKT.Intro<F, "X", X, any>,
          HKT.Intro<F, "I", I, any>,
          HKT.Intro<F, "S", S, any>,
          HKT.Intro<F, "R", R, any>,
          HKT.Intro<F, "E", E, any>,
          A
        >
      >
    >,
    A,
    K = HKT.Low<F, "K">,
    Q = HKT.Low<F, "Q">,
    W = HKT.Low<F, "W">,
    X = HKT.Low<F, "X">,
    I = HKT.Low<F, "I">,
    S = HKT.Low<F, "S">,
    R = HKT.Low<F, "R">,
    E = HKT.Low<F, "E">,
  >(
    r: Object.EnforceNonEmpty<KS> &
      Readonly<
        Record<
          string,
          HKT.Kind<
            F,
            FC,
            HKT.Intro<F, "K", K, any>,
            HKT.Intro<F, "Q", Q, any>,
            HKT.Intro<F, "W", W, any>,
            HKT.Intro<F, "X", X, any>,
            HKT.Intro<F, "I", I, any>,
            HKT.Intro<F, "S", S, any>,
            HKT.Intro<F, "R", R, any>,
            HKT.Intro<F, "E", E, any>,
            A
          >
        >
      >,
  ): HKT.Kind<
    F,
    FC,
    InferMixStruct<F, FC, "K", K, KS>,
    InferMixStruct<F, FC, "Q", Q, KS>,
    InferMixStruct<F, FC, "W", W, KS>,
    InferMixStruct<F, FC, "X", X, KS>,
    InferMixStruct<F, FC, "I", I, KS>,
    InferMixStruct<F, FC, "S", S, KS>,
    InferMixStruct<F, FC, "R", R, KS>,
    InferMixStruct<F, FC, "E", E, KS>,
    {
      [K in keyof KS]: HKT.Infer<F, FC, "A", KS[K]>;
    }
  >;
}

/**
 * @tsplus static fncts.ApplyOps sequenceSF
 */
export function sequenceSF<F extends HKT, C = HKT.None>(F: ApplyMin<F, C>): sequenceS<F, C>;
export function sequenceSF<F>(F: ApplyMin<HKT.F<F>>): sequenceS<HKT.F<F>> {
  return (r) => {
    const keys = globalThis.Object.keys(r);
    const len  = keys.length;
    const f    = getRecordConstructor(keys);
    let fr     = F.map_(r[keys[0]!]!, f);
    for (let i = 1; i < len; i++) {
      fr = F.ap_(fr, r[keys[i]!]!) as any;
    }
    return fr;
  };
}

export interface sequenceT<F extends HKT, FC = HKT.None> {
  <
    KT extends readonly [
      HKT.Kind<
        F,
        FC,
        HKT.Intro<F, "K", K, any>,
        HKT.Intro<F, "Q", Q, any>,
        HKT.Intro<F, "W", W, any>,
        HKT.Intro<F, "X", X, any>,
        HKT.Intro<F, "I", I, any>,
        HKT.Intro<F, "S", S, any>,
        HKT.Intro<F, "R", R, any>,
        HKT.Intro<F, "E", E, any>,
        unknown
      >,
      ...ReadonlyArray<
        HKT.Kind<
          F,
          FC,
          HKT.Intro<F, "K", K, any>,
          HKT.Intro<F, "Q", Q, any>,
          HKT.Intro<F, "W", W, any>,
          HKT.Intro<F, "X", X, any>,
          HKT.Intro<F, "I", I, any>,
          HKT.Intro<F, "S", S, any>,
          HKT.Intro<F, "R", R, any>,
          HKT.Intro<F, "E", E, any>,
          unknown
        >
      >,
    ],
    K = HKT.Low<F, "K">,
    Q = HKT.Low<F, "Q">,
    W = HKT.Low<F, "W">,
    X = HKT.Low<F, "X">,
    I = HKT.Low<F, "I">,
    S = HKT.Low<F, "S">,
    R = HKT.Low<F, "R">,
    E = HKT.Low<F, "E">,
  >(
    ...t: KT
  ): HKT.Kind<
    F,
    FC,
    InferMixTuple<F, FC, "K", K, KT>,
    InferMixTuple<F, FC, "Q", Q, KT>,
    InferMixTuple<F, FC, "W", W, KT>,
    InferMixTuple<F, FC, "X", X, KT>,
    InferMixTuple<F, FC, "I", I, KT>,
    InferMixTuple<F, FC, "S", S, KT>,
    InferMixTuple<F, FC, "R", R, KT>,
    InferMixTuple<F, FC, "E", E, KT>,
    {
      [K in keyof KT]: HKT.Infer<F, FC, "A", KT[K]>;
    }
  >;
}

/**
 * @tsplus static fncts.ApplyOps sequenceTF
 */
export function sequenceTF<F extends HKT, FC = HKT.None>(F: ApplyMin<F, FC>): sequenceT<F, FC>;
export function sequenceTF<F>(F: ApplyMin<HKT.F<F>>): sequenceT<HKT.F<F>> {
  return (...t) => {
    const len = t.length;
    const f   = getTupleConstructor(len);
    let fas   = F.map_(t[0], f);
    for (let i = 1; i < len; i++) {
      fas = F.ap_(fas, t[i]!) as any;
    }
    return fas;
  };
}

/*
 * -------------------------------------------------------------------------------------------------
 * internal
 * -------------------------------------------------------------------------------------------------
 */

/**
 * @internal
 */
function curried(f: Function, n: number, acc: ReadonlyArray<unknown>) {
  return function (x: unknown) {
    const combined = Array(acc.length + 1);
    for (let i = 0; i < acc.length; i++) {
      combined[i] = acc[i];
    }
    combined[acc.length] = x;
    /* eslint-disable-next-line prefer-spread */
    return n === 0 ? f.apply(null, combined) : curried(f, n - 1, combined);
  };
}
/**
 * @internal
 */
const tupleConstructors: Record<number, (a: unknown) => any> = {
  1: (a) => [a],
  2: (a) => (b: any) => [a, b],
  3: (a) => (b: any) => (c: any) => [a, b, c],
  4: (a) => (b: any) => (c: any) => (d: any) => [a, b, c, d],
  5: (a) => (b: any) => (c: any) => (d: any) => (e: any) => [a, b, c, d, e],
};

/**
 * @internal
 */
function getTupleConstructor(len: number): (a: unknown) => any {
  if (!tupleConstructors.hasOwnProperty(len)) {
    tupleConstructors[len] = curried(tuple, len - 1, []);
  }
  return tupleConstructors[len]!;
}

/**
 * @internal
 */
function getRecordConstructor(keys: ReadonlyArray<string>) {
  const len = keys.length;
  return curried(
    (...args: ReadonlyArray<unknown>) => {
      const r: Record<string, unknown> = {};
      for (let i = 0; i < len; i++) {
        r[keys[i]!] = args[i];
      }
      return r;
    },
    len - 1,
    [],
  );
}

/**
 * @internal
 */
type InferMixStruct<F extends HKT, FC, P extends HKT.ParamName, T, KS> = HKT.MixStruct<
  F,
  P,
  T,
  { [K in keyof KS]: HKT.Infer<F, FC, P, KS[K]> }
>;

/**
 * @internal
 */
type InferMixTuple<F extends HKT, FC, P extends HKT.ParamName, T, KT> = HKT.MixStruct<
  F,
  P,
  T,
  { [K in keyof KT & number]: HKT.Infer<F, FC, P, KT[K]> }
>;
