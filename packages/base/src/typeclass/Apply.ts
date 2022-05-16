import type { Functor } from "@fncts/base/typeclass/Functor";
import type { Semimonoidal } from "@fncts/base/typeclass/Semimonoidal";
import type { Object } from "@fncts/typelevel";

import { tuple } from "@fncts/base/data/function";

/**
 * @tsplus type fncts.Apply
 */
export interface Apply<F extends HKT> extends Semimonoidal<F>, Functor<F> {
  zipWith<K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B, D>(
    self: HKT.Kind<F, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
    that: HKT.Kind<
      F,
      HKT.Intro<"K", K1, K2>,
      HKT.Intro<"Q", Q1, Q2>,
      HKT.Intro<"W", W1, W2>,
      HKT.Intro<"X", X1, X2>,
      HKT.Intro<"I", I1, I2>,
      HKT.Intro<"S", S1, S2>,
      HKT.Intro<"R", R1, R2>,
      HKT.Intro<"E", E1, E2>,
      B
    >,
    f: (a: A, b: B) => D,
  ): HKT.Kind<
    F,
    HKT.Mix<"K", [K1, K2]>,
    HKT.Mix<"Q", [Q1, Q2]>,
    HKT.Mix<"W", [W1, W2]>,
    HKT.Mix<"X", [X1, X2]>,
    HKT.Mix<"I", [I1, I2]>,
    HKT.Mix<"S", [S1, S2]>,
    HKT.Mix<"R", [R1, R2]>,
    HKT.Mix<"E", [E1, E2]>,
    D
  >;
}

/**
 * @tsplus type fncts.ApplyOps
 */
export interface ApplyOps {}

export const Apply: ApplyOps = {};

/**
 * @tsplus fluent fncts.Kind zipWith
 */
export function zipWith<F extends HKT, K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B, D>(
  self: HKT.Kind<F, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
  that: HKT.Kind<
    F,
    HKT.Intro<"K", K1, K2>,
    HKT.Intro<"Q", Q1, Q2>,
    HKT.Intro<"W", W1, W2>,
    HKT.Intro<"X", X1, X2>,
    HKT.Intro<"I", I1, I2>,
    HKT.Intro<"S", S1, S2>,
    HKT.Intro<"R", R1, R2>,
    HKT.Intro<"E", E1, E2>,
    B
  >,
  f: (a: A, b: B) => D,
  /** @tsplus auto */ F: Apply<F>,
): HKT.Kind<
  F,
  HKT.Mix<"K", [K1, K2]>,
  HKT.Mix<"Q", [Q1, Q2]>,
  HKT.Mix<"W", [W1, W2]>,
  HKT.Mix<"X", [X1, X2]>,
  HKT.Mix<"I", [I1, I2]>,
  HKT.Mix<"S", [S1, S2]>,
  HKT.Mix<"R", [R1, R2]>,
  HKT.Mix<"E", [E1, E2]>,
  D
> {
  return F.zipWith(self, that, f);
}

/**
 * @tsplus fluent fncts.Kind ap
 */
export function ap<F extends HKT, K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
  fab: HKT.Kind<F, K1, Q1, W1, X1, I1, S1, R1, E1, (a: A) => B>,
  fa: HKT.Kind<
    F,
    HKT.Intro<"K", K1, K2>,
    HKT.Intro<"Q", Q1, Q2>,
    HKT.Intro<"W", W1, W2>,
    HKT.Intro<"X", X1, X2>,
    HKT.Intro<"I", I1, I2>,
    HKT.Intro<"S", S1, S2>,
    HKT.Intro<"R", R1, R2>,
    HKT.Intro<"E", E1, E2>,
    A
  >,
  /** @tsplus auto */ F: Apply<F>,
): HKT.Kind<
  F,
  HKT.Mix<"K", [K1, K2]>,
  HKT.Mix<"Q", [Q1, Q2]>,
  HKT.Mix<"W", [W1, W2]>,
  HKT.Mix<"X", [X1, X2]>,
  HKT.Mix<"I", [I1, I2]>,
  HKT.Mix<"S", [S1, S2]>,
  HKT.Mix<"R", [R1, R2]>,
  HKT.Mix<"E", [E1, E2]>,
  B
> {
  return fab.zipWith(fa, (f, a) => f(a));
}

/**
 * @tsplus fluent fncts.Kind apFirst
 */
export function apFirst<F extends HKT, K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
  fa: HKT.Kind<F, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
  fb: HKT.Kind<
    F,
    HKT.Intro<"K", K1, K2>,
    HKT.Intro<"Q", Q1, Q2>,
    HKT.Intro<"W", W1, W2>,
    HKT.Intro<"X", X1, X2>,
    HKT.Intro<"I", I1, I2>,
    HKT.Intro<"S", S1, S2>,
    HKT.Intro<"R", R1, R2>,
    HKT.Intro<"E", E1, E2>,
    B
  >,
  /** @tsplus auto */ F: Apply<F>,
): HKT.Kind<
  F,
  HKT.Mix<"K", [K1, K2]>,
  HKT.Mix<"Q", [Q1, Q2]>,
  HKT.Mix<"W", [W1, W2]>,
  HKT.Mix<"X", [X1, X2]>,
  HKT.Mix<"I", [I1, I2]>,
  HKT.Mix<"S", [S1, S2]>,
  HKT.Mix<"R", [R1, R2]>,
  HKT.Mix<"E", [E1, E2]>,
  A
> {
  return fa.zipWith(fb, (a, _) => a);
}

/**
 * @tsplus fluent fncts.Kind apSecond
 */
export function apSecond<F extends HKT, K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
  fa: HKT.Kind<F, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
  fb: HKT.Kind<
    F,
    HKT.Intro<"K", K1, K2>,
    HKT.Intro<"Q", Q1, Q2>,
    HKT.Intro<"W", W1, W2>,
    HKT.Intro<"X", X1, X2>,
    HKT.Intro<"I", I1, I2>,
    HKT.Intro<"S", S1, S2>,
    HKT.Intro<"R", R1, R2>,
    HKT.Intro<"E", E1, E2>,
    B
  >,
  /** @tsplus auto */ F: Apply<F>,
): HKT.Kind<
  F,
  HKT.Mix<"K", [K1, K2]>,
  HKT.Mix<"Q", [Q1, Q2]>,
  HKT.Mix<"W", [W1, W2]>,
  HKT.Mix<"X", [X1, X2]>,
  HKT.Mix<"I", [I1, I2]>,
  HKT.Mix<"S", [S1, S2]>,
  HKT.Mix<"R", [R1, R2]>,
  HKT.Mix<"E", [E1, E2]>,
  B
> {
  return fa.zipWith(fb, (_, b) => b);
}

export function apS<
  F extends HKT,
  K1,
  Q1,
  W1,
  X1,
  I1,
  S1,
  R1,
  E1,
  A,
  BN extends string,
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
  fa: HKT.Kind<F, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
  name: Exclude<BN, keyof A>,
  fb: HKT.Kind<
    F,
    HKT.Intro<"K", K1, K2>,
    HKT.Intro<"Q", Q1, Q2>,
    HKT.Intro<"W", W1, W2>,
    HKT.Intro<"X", X1, X2>,
    HKT.Intro<"I", I1, I2>,
    HKT.Intro<"S", S1, S2>,
    HKT.Intro<"R", R1, R2>,
    HKT.Intro<"E", E1, E2>,
    B
  >,
  /** @tsplus auto */ F: Apply<F>,
): HKT.Kind<
  F,
  HKT.Mix<"K", [K1, K2]>,
  HKT.Mix<"Q", [Q1, Q2]>,
  HKT.Mix<"W", [W1, W2]>,
  HKT.Mix<"X", [X1, X2]>,
  HKT.Mix<"I", [I1, I2]>,
  HKT.Mix<"S", [S1, S2]>,
  HKT.Mix<"R", [R1, R2]>,
  HKT.Mix<"E", [E1, E2]>,
  { [K in keyof A | BN]: K extends keyof A ? A[K] : B }
> {
  return fa.zipWith(fb, (a, b) => ({ ...a, [name]: b } as { [K in keyof A | BN]: K extends keyof A ? A[K] : B }));
}

/**
 * @tsplus static fncts.ApplyOps sequenceS
 */
export function sequenceS<
  F extends HKT,
  KS extends Readonly<
    Record<
      string,
      HKT.Kind<
        F,
        HKT.Intro<"K", K, any>,
        HKT.Intro<"Q", Q, any>,
        HKT.Intro<"W", W, any>,
        HKT.Intro<"Q", Q, any>,
        HKT.Intro<"I", I, any>,
        HKT.Intro<"S", S, any>,
        HKT.Intro<"R", R, any>,
        HKT.Intro<"E", E, any>,
        A
      >
    >
  >,
  A,
  K = HKT.Low<"K">,
  Q = HKT.Low<"Q">,
  W = HKT.Low<"W">,
  I = HKT.Low<"I">,
  S = HKT.Low<"S">,
  R = HKT.Low<"R">,
  E = HKT.Low<"E">,
>(
  r: Object.EnforceNonEmpty<KS> &
    Readonly<
      Record<
        string,
        HKT.Kind<
          F,
          HKT.Intro<"K", K, any>,
          HKT.Intro<"Q", Q, any>,
          HKT.Intro<"W", W, any>,
          HKT.Intro<"Q", Q, any>,
          HKT.Intro<"I", I, any>,
          HKT.Intro<"S", S, any>,
          HKT.Intro<"R", R, any>,
          HKT.Intro<"E", E, any>,
          A
        >
      >
    >,
  /** @tsplus auto */ F: Apply<F>,
): HKT.Kind<
  F,
  InferMixStruct<F, "K", K, KS>,
  InferMixStruct<F, "Q", Q, KS>,
  InferMixStruct<F, "W", W, KS>,
  InferMixStruct<F, "Q", Q, KS>,
  InferMixStruct<F, "I", I, KS>,
  InferMixStruct<F, "S", S, KS>,
  InferMixStruct<F, "R", R, KS>,
  InferMixStruct<F, "E", E, KS>,
  {
    [K in keyof KS]: HKT.Infer<F, "A", KS[K]>;
  }
> {
  const keys = globalThis.Object.keys(r);
  const len  = keys.length;
  const f    = getRecordConstructor(keys);
  let fr     = F.map(r[keys[0]!]! as HKT.ErasedKind<F>, f);
  for (let i = 1; i < len; i++) {
    fr = fr.ap(r[keys[i]!]!, F);
  }
  return fr;
}

export function sequenceT<
  F extends HKT,
  KT extends readonly [
    HKT.Kind<
      F,
      HKT.Intro<"K", K, any>,
      HKT.Intro<"Q", Q, any>,
      HKT.Intro<"W", W, any>,
      HKT.Intro<"Q", Q, any>,
      HKT.Intro<"I", I, any>,
      HKT.Intro<"S", S, any>,
      HKT.Intro<"R", R, any>,
      HKT.Intro<"E", E, any>,
      unknown
    >,
    ...ReadonlyArray<
      HKT.Kind<
        F,
        HKT.Intro<"K", K, any>,
        HKT.Intro<"Q", Q, any>,
        HKT.Intro<"W", W, any>,
        HKT.Intro<"Q", Q, any>,
        HKT.Intro<"I", I, any>,
        HKT.Intro<"S", S, any>,
        HKT.Intro<"R", R, any>,
        HKT.Intro<"E", E, any>,
        unknown
      >
    >,
  ],
  K = HKT.Low<"K">,
  Q = HKT.Low<"Q">,
  W = HKT.Low<"W">,
  I = HKT.Low<"I">,
  S = HKT.Low<"S">,
  R = HKT.Low<"R">,
  E = HKT.Low<"E">,
>(
  t: [...KT],
  /** @tsplus auto */ F: Apply<F>,
): HKT.Kind<
  F,
  InferMixTuple<F, "K", K, KT>,
  InferMixTuple<F, "Q", Q, KT>,
  InferMixTuple<F, "W", W, KT>,
  InferMixTuple<F, "Q", Q, KT>,
  InferMixTuple<F, "I", I, KT>,
  InferMixTuple<F, "S", S, KT>,
  InferMixTuple<F, "R", R, KT>,
  InferMixTuple<F, "E", E, KT>,
  {
    [K in keyof KT]: HKT.Infer<F, "A", KT[K]>;
  }
> {
  const len = t.length;
  const f   = getTupleConstructor(len);
  let fas   = F.map(t[0] as HKT.ErasedKind<F>, f);
  for (let i = 1; i < len; i++) {
    fas = fas.ap(t[i]!, F);
  }
  return fas;
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
type InferMixStruct<F extends HKT, P extends HKT.ParamName, T, KS> = HKT.MixStruct<
  P,
  T,
  { [K in keyof KS]: HKT.Infer<F, P, KS[K]> }
>;

/**
 * @internal
 */
type InferMixTuple<F extends HKT, P extends HKT.ParamName, T, KT> = HKT.MixStruct<
  P,
  T,
  { [K in keyof KT & number]: HKT.Infer<F, P, KT[K]> }
>;
