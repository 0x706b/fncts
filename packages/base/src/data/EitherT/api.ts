import type { EitherT } from "./definition.js";
import type * as P from "@fncts/base/typeclass";

/**
 * @tsplus static fncts.EitherTOps __call
 */
export function make<F extends HKT, FC, K, Q, W, X, I, S, R, FE, E, A>(
  self: HKT.Kind<F, FC, K, Q, W, X, I, S, R, FE, Either<E, A>>,
): EitherT<F, FC, K, Q, W, X, I, S, R, FE, E, A> {
  return self;
}

/**
 * @tsplus static fncts.EitherTOps right
 */
export function right<F extends HKT, FC>(
  F: P.Pointed<F, FC>,
): <K, Q, W, X, I, S, R, FE, E = never, A = never>(a: A) => EitherT<F, FC, K, Q, W, X, I, S, R, FE, E, A> {
  return (a) => F.pure(Either.right(a));
}

/**
 * @tsplus static fncts.EitherTOps left
 */
export function left<F extends HKT, FC>(
  F: P.Pointed<F, FC>,
): <K, Q, W, X, I, S, R, FE, E, A = never>(e: E) => EitherT<F, FC, K, Q, W, X, I, S, R, FE, E, A> {
  return (e) => F.pure(Either.left(e));
}

/**
 * @tsplus static fncts.EitherTOps rightF
 */
export function rightF<F extends HKT, FC>(
  F: P.Functor<F, FC>,
): <K, Q, W, X, I, S, R, FE, E = never, A = never>(
  self: HKT.Kind<F, FC, K, Q, W, X, I, S, R, FE, A>,
) => EitherT<F, FC, K, Q, W, X, I, S, R, FE, E, A> {
  return F.map(Either.right);
}

/**
 * @tsplus static fncts.EitherTOps leftF
 */
export function leftF<F extends HKT, FC>(
  F: P.Functor<F, FC>,
): <K, Q, W, X, I, S, R, FE, E = never, A = never>(
  self: HKT.Kind<F, FC, K, Q, W, X, I, S, R, FE, E>,
) => EitherT<F, FC, K, Q, W, X, I, S, R, FE, E, A> {
  return F.map(Either.left);
}

/**
 * @tsplus static fncts.EitherTOps map
 */
export function map<F extends HKT, FC>(F: P.Functor<F, FC>) {
  return <A, B>(
    f: (a: A) => B,
  ): (<K, Q, W, X, I, S, R, FE, E>(
    self: EitherT<F, FC, K, Q, W, X, I, S, R, FE, E, A>,
  ) => EitherT<F, FC, K, Q, W, X, I, S, R, FE, E, B>) => F.map((either) => either.map(f));
}

/**
 * @tsplus static fncts.EitherTOps mapLeft
 */
export function mapLeft<F extends HKT, FC = HKT.None>(F: P.Functor<F, FC>) {
  return <E, E1>(
    f: (e: E) => E1,
  ): (<K, Q, W, X, I, S, R, FE, A>(
    self: HKT.Kind<F, FC, K, Q, W, X, I, S, R, FE, Either<E, A>>,
  ) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, FE, Either<E1, A>>) => F.map((either) => either.mapLeft(f));
}

/**
 * @tsplus static fncts.EitherTOps bimap
 */
export function bimap<F extends HKT, FC = HKT.None>(F: P.Functor<F, FC>) {
  return <E, A, E1, B>(
    f: (e: E) => E1,
    g: (a: A) => B,
  ): (<K, Q, W, X, I, S, R, FE>(
    self: HKT.Kind<F, FC, K, Q, W, X, I, S, R, FE, Either<E, A>>,
  ) => HKT.Kind<F, FC, K, Q, W, X, I, S, R, FE, Either<E1, B>>) => F.map((either) => either.bimap(f, g));
}

/**
 * @tsplus static fncts.EitherTOps flatMap
 */
export function flatMap<F extends HKT, FC>(F: P.Monad<F, FC>) {
  return <K, Q, W, X, I, S, R, FE, A, K1, Q1, W1, X1, I1, S1, R1, FE1, E1, B>(
    f: (
      a: A,
    ) => HKT.Kind<
      F,
      FC,
      HKT.Intro<F, "K", K, K1>,
      HKT.Intro<F, "Q", Q, Q1>,
      HKT.Intro<F, "W", W, W1>,
      HKT.Intro<F, "X", X, X1>,
      HKT.Intro<F, "I", I, I1>,
      HKT.Intro<F, "S", S, S1>,
      HKT.Intro<F, "R", R, R1>,
      HKT.Intro<F, "E", FE, FE1>,
      Either<E1, B>
    >,
  ): (<E>(
    self: EitherT<F, FC, K, Q, W, X, I, S, R, FE, E, A>,
  ) => EitherT<
    F,
    FC,
    HKT.Mix<F, "K", [K, K1]>,
    HKT.Mix<F, "Q", [Q, Q1]>,
    HKT.Mix<F, "W", [W, W1]>,
    HKT.Mix<F, "X", [X, X1]>,
    HKT.Mix<F, "I", [I, I1]>,
    HKT.Mix<F, "S", [S, S1]>,
    HKT.Mix<F, "R", [R, R1]>,
    HKT.Mix<F, "E", [FE, FE1]>,
    E | E1,
    B
  >) =>
    F.flatMap(
      (either) =>
        either.match({
          Left: (e) => F.pure(Either.left(e)),
          Right: (a) => f(a),
        }) as HKT.Kind<
          F,
          FC,
          HKT.Intro<F, "K", K, K1>,
          HKT.Intro<F, "Q", Q, Q1>,
          HKT.Intro<F, "W", W, W1>,
          HKT.Intro<F, "X", X, X1>,
          HKT.Intro<F, "I", I, I1>,
          HKT.Intro<F, "S", S, S1>,
          HKT.Intro<F, "R", R, R1>,
          HKT.Intro<F, "E", FE, FE1>,
          Either<E1, B>
        >,
    );
}

/**
 * @tsplus static fncts.EitherTOps zipWith
 */
export function zipWith<F extends HKT, FC = HKT.None>(
  F: P.Apply<F, FC>,
): <K, Q, W, X, I, S, R, EF, A, K1, Q1, W1, X1, I1, S1, R1, EF1, E1, B, C>(
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
    HKT.Intro<F, "E", EF, EF1>,
    Either<E1, B>
  >,
  f: (a: A, b: B) => C,
) => <E>(
  self: HKT.Kind<F, FC, K, Q, W, X, I, S, R, EF, Either<E, A>>,
) => HKT.Kind<
  F,
  FC,
  HKT.Intro<F, "K", K, K1>,
  HKT.Intro<F, "Q", Q, Q1>,
  HKT.Intro<F, "W", W, W1>,
  HKT.Intro<F, "X", X, X1>,
  HKT.Intro<F, "I", I, I1>,
  HKT.Intro<F, "S", S, S1>,
  HKT.Intro<F, "R", R, R1>,
  HKT.Intro<F, "E", EF, EF1>,
  Either<E | E1, C>
>;
export function zipWith<F extends HKT>(F: P.Apply<HKT.F<F>>) {
  return <A, E1, B, C>(
    that: HKT.FK1<F, Either<E1, B>>,
    f: (a: A, b: B) => C,
  ): (<E>(self: HKT.FK1<F, Either<E, A>>) => HKT.FK1<F, Either<E | E1, C>>) =>
    F.zipWith(that, (a, b) => a.zipWith(b, f));
}

/**
 * @tsplus static fncts.EitherTOps orElse
 */
export function orElse<F extends HKT, FC = HKT.None>(
  F: P.Monad<F, FC>,
): <K, Q, W, X, I, S, R, EF, K1, Q1, W1, X1, I1, S1, R1, EF1, E1, B>(
  that: Lazy<
    HKT.Kind<
      F,
      FC,
      HKT.Intro<F, "K", K, K1>,
      HKT.Intro<F, "Q", Q, Q1>,
      HKT.Intro<F, "W", W, W1>,
      HKT.Intro<F, "X", X, X1>,
      HKT.Intro<F, "I", I, I1>,
      HKT.Intro<F, "S", S, S1>,
      HKT.Intro<F, "R", R, R1>,
      HKT.Intro<F, "E", EF, EF1>,
      Either<E1, B>
    >
  >,
) => <E, A>(
  fa: HKT.Kind<F, FC, K, Q, W, X, I, S, R, EF, Either<E, A>>,
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
  HKT.Mix<F, "E", [EF, EF1]>,
  Either<E | E1, A | B>
>;
export function orElse<F>(F: P.Monad<HKT.F1<F>>) {
  return <E, A, E1, B>(
    that: Lazy<HKT.FK1<F, Either<E1, B>>>,
  ): ((self: HKT.FK1<F, Either<E, A>>) => HKT.FK1<F, Either<E | E1, A | B>>) =>
    F.flatMap((either) =>
      either.match({
        Left: () => that(),
        Right: () => F.pure(either),
      }),
    );
}
