import type { Monoid } from "@fncts/base/typeclass/Monoid";

/**
 * @tsplus type fncts.Foldable
 */
export interface Foldable<F extends HKT, FC = HKT.None> extends HKT.Typeclass<F, FC> {
  readonly foldLeft_: foldLeft_<F, FC>;
  readonly foldLeft: foldLeft<F, FC>;
  readonly foldRight_: foldRight_<F, FC>;
  readonly foldRight: foldRight<F, FC>;
  readonly foldMap_: foldMap_<F, FC>;
  readonly foldMap: foldMap<F, FC>;
}

/**
 * @tsplus type fncts.FoldableOps
 */
export interface FoldableOps {}

export const Foldable: FoldableOps = {};

export type FoldableMin<F extends HKT, FC = HKT.None> = {
  readonly foldLeft_: foldLeft_<F, FC>;
  readonly foldRight_: foldRight_<F, FC>;
};

/**
 * @tsplus static fncts.FoldableOps __call
 */
export function mkFoldable<F extends HKT, FC = HKT.None>(F: FoldableMin<F, FC>): Foldable<F, FC> {
  const foldMap_: foldMap_<F, FC> = (fa, f, M) => F.foldLeft_(fa, M.nat, (b, a) => M.combine(b, f(a)));

  return HKT.instance<Foldable<F, FC>>({
    foldLeft_: F.foldLeft_,
    foldLeft: (b, f) => (fa) => F.foldLeft_(fa, b, f),
    foldRight_: F.foldRight_,
    foldRight: (b, f) => (fa) => F.foldRight_(fa, b, f),
    foldMap_,
    foldMap: (M) => (f) => (fa) => foldMap_(fa, f, M),
  });
}

export interface foldLeft_<F extends HKT, FC = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, B>(fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>, b: B, f: (b: B, a: A) => B): B;
}

export interface foldLeft<F extends HKT, FC = HKT.None> {
  <A, B>(b: B, f: (b: B, a: A) => B): <K, Q, W, X, I, S, R, E>(fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>) => B;
}

export interface foldRight_<F extends HKT, FC = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, B>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
    b: Eval<B>,
    f: (a: A, b: Eval<B>) => Eval<B>,
  ): Eval<B>;
}

export interface foldRight<F extends HKT, FC = HKT.None> {
  <A, B>(b: Eval<B>, f: (a: A, b: Eval<B>) => Eval<B>): <K, Q, W, X, I, S, R, E>(
    fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, E, A>,
  ) => Eval<B>;
}

export interface foldMap_<F extends HKT, C = HKT.None> {
  <K, Q, W, X, I, S, R, E, A, M>(
    fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>,
    f: (a: A) => M,
    /** @tsplus auto */ M: Monoid<M>,
  ): M;
}

export interface foldMap<F extends HKT, C = HKT.None> {
  <M>(M: Monoid<M>): <A>(
    f: (a: A) => M,
  ) => <K, Q, W, X, I, S, R, E>(fa: HKT.Kind<F, C, K, Q, W, X, I, S, R, E, A>) => M;
}
