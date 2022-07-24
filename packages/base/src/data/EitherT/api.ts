import type * as P from "@fncts/base/typeclass";

import { EitherT } from "./definition.js";

/**
 * @tsplus static fncts.EitherTOps __call
 */
export function make<F extends HKT, K, Q, W, X, I, S, R, FE, E, A>(
  self: HKT.Kind<F, K, Q, W, X, I, S, R, FE, Either<E, A>>,
): EitherT<F, K, Q, W, X, I, S, R, FE, E, A> {
  return new EitherT(self);
}

/**
 * @tsplus static fncts.EitherTOps right
 */
export function right<F extends HKT, K, Q, W, X, I, S, R, FE, E = never, A = never>(
  a: A,
  /** @tsplus auto */ F: P.Pointed<F>,
): EitherT<F, K, Q, W, X, I, S, R, FE, E, A> {
  return EitherT(F.pure(Either.right(a)));
}

/**
 * @tsplus static fncts.EitherTOps left
 */
export function left<F extends HKT, K, Q, W, X, I, S, R, FE, E, A = never>(
  e: E,
  /** @tsplus auto */ F: P.Pointed<F>,
): EitherT<F, K, Q, W, X, I, S, R, FE, E, A> {
  return EitherT(F.pure(Either.left(e)));
}

/**
 * @tsplus static fncts.EitherTOps rightF
 */
export function rightF<F extends HKT, K, Q, W, X, I, S, R, FE, E = never, A = never>(
  self: HKT.Kind<F, K, Q, W, X, I, S, R, FE, A>,
  /** @tsplus auto */ F: P.Functor<F>,
): EitherT<F, K, Q, W, X, I, S, R, FE, E, A> {
  return EitherT(self.map(Either.right));
}

/**
 * @tsplus static fncts.EitherTOps leftF
 */
export function leftF<F extends HKT, K, Q, W, X, I, S, R, FE, E = never, A = never>(
  self: HKT.Kind<F, K, Q, W, X, I, S, R, FE, E>,
  /** @tsplus auto */ F: P.Functor<F>,
): EitherT<F, K, Q, W, X, I, S, R, FE, E, A> {
  return EitherT(self.map(Either.left));
}

/**
 * @tsplus fluent fncts.EitherT map
 */
export function map<F extends HKT, K, Q, W, X, I, S, R, FE, E, A, B>(
  self: EitherT<F, K, Q, W, X, I, S, R, FE, E, A>,
  f: (a: A) => B,
  /** @tsplus auto */ F: P.Functor<F>,
): EitherT<F, K, Q, W, X, I, S, R, FE, E, B> {
  return EitherT(self.getEitherT.map((either) => either.map(f)));
}

/**
 * @tsplus fluent fncts.EitherT flatMap
 */
export function flatMap<F extends HKT, K, Q, W, X, I, S, R, FE, E, A, K1, Q1, W1, X1, I1, S1, R1, FE1, E1, B>(
  self: EitherT<F, K, Q, W, X, I, S, R, FE, E, A>,
  f: (
    a: A,
  ) => HKT.Kind<
    F,
    HKT.Intro<"K", K, K1>,
    HKT.Intro<"Q", Q, Q1>,
    HKT.Intro<"W", W, W1>,
    HKT.Intro<"X", X, X1>,
    HKT.Intro<"I", I, I1>,
    HKT.Intro<"S", S, S1>,
    HKT.Intro<"R", R, R1>,
    HKT.Intro<"E", FE, FE1>,
    Either<E1, B>
  >,
  /** @tsplus auto */ F: P.Monad<F>,
): EitherT<
  F,
  HKT.Mix<"K", [K, K1]>,
  HKT.Mix<"Q", [Q, Q1]>,
  HKT.Mix<"W", [W, W1]>,
  HKT.Mix<"X", [X, X1]>,
  HKT.Mix<"I", [I, I1]>,
  HKT.Mix<"S", [S, S1]>,
  HKT.Mix<"R", [R, R1]>,
  HKT.Mix<"E", [FE, FE1]>,
  E | E1,
  B
> {
  return EitherT(
    self.getEitherT.flatMap(
      (either) =>
        either.match(
          (e) => F.pure(Either.left(e)),
          (a) => f(a),
        ) as HKT.Kind<
          F,
          HKT.Intro<"K", K, K1>,
          HKT.Intro<"Q", Q, Q1>,
          HKT.Intro<"W", W, W1>,
          HKT.Intro<"X", X, X1>,
          HKT.Intro<"I", I, I1>,
          HKT.Intro<"S", S, S1>,
          HKT.Intro<"R", R, R1>,
          HKT.Intro<"E", FE, FE1>,
          Either<E1, B>
        >,
    ),
  );
}
