import type { Functor } from "@fncts/base/typeclass/Functor";
import type { Semimonoidal } from "@fncts/base/typeclass/Semimonoidal";
import type { Object } from "@fncts/typelevel";

import { tuple } from "@fncts/base/data/function";

/**
 * @tsplus type fncts.Apply
 */
export interface Apply<F extends HKT, FC = HKT.None> extends Semimonoidal<F, FC>, Functor<F, FC> {
  zipWith: <K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B, D>(
    self: HKT.Kind<F, FC, K1, Q1, W1, X1, I1, S1, R1, E1, A>,
    that: HKT.Kind<
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
    f: (a: A, b: B) => D,
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
    D
  >;
}

/**
 * @tsplus type fncts.ApplyOps
 */
export interface ApplyOps {}

export const Apply: ApplyOps = {};

/**
 * @tsplus static fncts.ApplyOps ap
 */
export function ap<F extends HKT, FC = HKT.None>(
  F: Apply<F, FC>,
): <K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
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
> {
  return (fab, fa) => F.zipWith(fab, fa, (f, a) => f(a));
}

/**
 * @tsplus static fncts.ApplyOps apFirst
 */
export function apFirst<F extends HKT, FC = HKT.None>(
  F: Apply<F, FC>,
): <K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
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
> {
  return (fa, fb) => F.zipWith(fa, fb, (a, _) => a);
}

/**
 * @tsplus static fncts.ApplyOps apSecond
 */
export function apSecond<F extends HKT, FC = HKT.None>(
  F: Apply<F, FC>,
): <K1, Q1, W1, X1, I1, S1, R1, E1, A, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
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
> {
  return (fa, fb) => F.zipWith(fa, fb, (_, b) => b);
}

export function apS<F extends HKT, FC = HKT.None>(
  F: Apply<F, FC>,
): <K1, Q1, W1, X1, I1, S1, R1, E1, A, BN extends string, K2, Q2, W2, X2, I2, S2, R2, E2, B>(
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
  { [K in keyof A | BN]: K extends keyof A ? A[K] : B }
> {
  return (fa, name, fb) => F.zipWith(fa, fb, (a, b) => unsafeCoerce({ ...a, [name]: b }));
}

/**
 * @tsplus static fncts.ApplyOps sequenceS
 */
export function sequenceS<F extends HKT, FC = HKT.None>(
  F: Apply<F, FC>,
): <
  KS extends Readonly<
    Record<
      string,
      HKT.Kind<
        F,
        FC,
        HKT.Intro<F, "K", K, any>,
        HKT.Intro<F, "Q", Q, any>,
        HKT.Intro<F, "W", W, any>,
        HKT.Intro<F, "Q", Q, any>,
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
          HKT.Intro<F, "Q", Q, any>,
          HKT.Intro<F, "I", I, any>,
          HKT.Intro<F, "S", S, any>,
          HKT.Intro<F, "R", R, any>,
          HKT.Intro<F, "E", E, any>,
          A
        >
      >
    >,
) => HKT.Kind<
  F,
  FC,
  InferMixStruct<F, FC, "K", K, KS>,
  InferMixStruct<F, FC, "Q", Q, KS>,
  InferMixStruct<F, FC, "W", W, KS>,
  InferMixStruct<F, FC, "Q", Q, KS>,
  InferMixStruct<F, FC, "I", I, KS>,
  InferMixStruct<F, FC, "S", S, KS>,
  InferMixStruct<F, FC, "R", R, KS>,
  InferMixStruct<F, FC, "E", E, KS>,
  {
    [K in keyof KS]: HKT.Infer<F, FC, "A", KS[K]>;
  }
> {
  return (r) => {
    const keys = globalThis.Object.keys(r);
    const len  = keys.length;
    const f    = getRecordConstructor(keys);
    let fr     = F.map(r[keys[0]!]!, f);
    for (let i = 1; i < len; i++) {
      fr = Apply.ap(F)(fr, unsafeCoerce(r[keys[i]!]!));
    }
    return unsafeCoerce(fr);
  };
}

export function sequenceT<F extends HKT, FC = HKT.None>(
  F: Apply<F, FC>,
): <
  KT extends readonly [
    HKT.Kind<
      F,
      FC,
      HKT.Intro<F, "K", K, any>,
      HKT.Intro<F, "Q", Q, any>,
      HKT.Intro<F, "W", W, any>,
      HKT.Intro<F, "Q", Q, any>,
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
        HKT.Intro<F, "Q", Q, any>,
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
  I = HKT.Low<F, "I">,
  S = HKT.Low<F, "S">,
  R = HKT.Low<F, "R">,
  E = HKT.Low<F, "E">,
>(
  t: [...KT],
) => HKT.Kind<
  F,
  FC,
  InferMixTuple<F, FC, "K", K, KT>,
  InferMixTuple<F, FC, "Q", Q, KT>,
  InferMixTuple<F, FC, "W", W, KT>,
  InferMixTuple<F, FC, "Q", Q, KT>,
  InferMixTuple<F, FC, "I", I, KT>,
  InferMixTuple<F, FC, "S", S, KT>,
  InferMixTuple<F, FC, "R", R, KT>,
  InferMixTuple<F, FC, "E", E, KT>,
  {
    [K in keyof KT]: HKT.Infer<F, FC, "A", KT[K]>;
  }
> {
  return (t) => {
    const len = t.length;
    const f   = getTupleConstructor(len);
    let fas   = F.map(t[0], f);
    for (let i = 1; i < len; i++) {
      fas = Apply.ap(F)(fas, unsafeCoerce(t[i]!));
    }
    return unsafeCoerce(fas);
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
