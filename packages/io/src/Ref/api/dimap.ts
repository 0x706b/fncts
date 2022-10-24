import type { PRef } from "../definition.js";

/**
 * Transforms the `set` value of the `Ref` with the specified function.
 *
 * @tsplus pipeable fncts.io.Ref contramap
 * @tsplus pipeable fncts.io.Ref.Synchronized contramap
 */
export function contramap<A, C>(f: (_: C) => A, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, B>(self: PRef<RA, RB, EA, EB, A, B>): PRef<RA, RB, EA, EB, C, B> => {
    return self.contramapEither((c) => Either.right(f(c)));
  };
}

/**
 * Transforms the `set` value of the `Ref` with the specified fallible
 * function.
 *
 * @tsplus pipeable fncts.io.Ref contramapEither
 * @tsplus pipeable fncts.io.Ref.Synchronized contramapEither
 */
export function contramapEither<A, EC, C>(f: (_: C) => Either<EC, A>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, B>(self: PRef<RA, RB, EA, EB, A, B>): PRef<RA, RB, EC | EA, EB, C, B> => {
    return self.dimapEither(f, Either.right);
  };
}

/**
 * Transforms both the `set` and `get` values of the `Ref` with the
 * specified functions.
 *
 * @tsplus pipeable fncts.io.Ref dimap
 * @tsplus pipeable fncts.io.Ref.Synchronized dimap
 */
export function dimap<A, B, C, D>(f: (_: C) => A, g: (_: B) => D, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(self: PRef<RA, RB, EA, EB, A, B>): PRef<RA, RB, EA, EB, C, D> => {
    return self.dimapEither(
      (c) => Either.right(f(c)),
      (b) => Either.right(g(b)),
    );
  };
}

/**
 * Transforms both the `set` and `get` values of the `Ref` with the
 * specified fallible functions.
 *
 * @tsplus pipeable fncts.io.Ref dimapEither
 * @tsplus pipeable fncts.io.Ref.Synchronized dimapEither
 */
export function dimapEither<A, B, C, EC, D, ED>(
  f: (_: C) => Either<EC, A>,
  g: (_: B) => Either<ED, D>,
  __tsplusTrace?: string,
) {
  return <RA, RB, EA, EB>(ref: PRef<RA, RB, EA, EB, A, B>): PRef<RA, RB, EC | EA, ED | EB, C, D> => {
    return ref.match(
      (ea: EA | EC) => ea,
      (eb: EB | ED) => eb,
      f,
      g,
    );
  };
}

/**
 * Transforms both the `set` and `get` errors of the `Ref` with the
 * specified functions.
 *
 * @tsplus pipeable fncts.io.Ref dimapError
 * @tsplus pipeable fncts.io.Ref.Synchronized dimapError
 */
export function dimapError<EA, EB, EC, ED>(f: (_: EA) => EC, g: (_: EB) => ED, __tsplusTrace?: string) {
  return <RA, RB, A, B>(ref: PRef<RA, RB, EA, EB, A, B>): PRef<RA, RB, EC, ED, A, B> => {
    return ref.match(f, g, Either.right, Either.right);
  };
}

/**
 * Transforms the `get` value of the `Ref` with the specified fallible
 * function.
 *
 * @tsplus pipeable fncts.io.Ref mapEither
 * @tsplus pipeable fncts.io.Ref.Synchronized mapEither
 */
export function mapEither<B, EC, C>(f: (_: B) => Either<EC, C>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A>(ref: PRef<RA, RB, EA, EB, A, B>): PRef<RA, RB, EA, EC | EB, A, C> => {
    return ref.dimapEither(Either.right, f);
  };
}

/**
 * Transforms the `get` value of the `Ref` with the specified function.
 *
 * @tsplus pipeable fncts.io.Ref map
 * @tsplus pipeable fncts.io.Ref.Synchronized map
 */
export function map<B, C>(f: (_: B) => C, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A>(ref: PRef<RA, RB, EA, EB, A, B>): PRef<RA, RB, EA, EB, A, C> => {
    return ref.mapEither((b) => Either.right(f(b)));
  };
}
