import type { PRef } from "../definition";

import { Either } from "../../../data/Either";

/**
 * Transforms the `set` value of the `Ref` with the specified function.
 *
 * @tsplus fluent fncts.control.Ref contramap
 * @tsplus fluent fncts.control.Ref.Synchronized contramap
 */
export function contramap_<RA, RB, EA, EB, B, A, C>(ref: PRef<RA, RB, EA, EB, A, B>, f: (_: C) => A): PRef<RA, RB, EA, EB, C, B> {
  return ref.contramapEither((c) => Either.right(f(c)));
}

/**
 * Transforms the `set` value of the `Ref` with the specified fallible
 * function.
 *
 * @tsplus fluent fncts.control.Ref contramapEither
 * @tsplus fluent fncts.control.Ref.Synchronized contramapEither
 */
export function contramapEither_<RA, RB, EA, EB, A, B, EC, C>(
  ref: PRef<RA, RB, EA, EB, A, B>,
  f: (_: C) => Either<EC, A>,
): PRef<RA, RB, EC | EA, EB, C, B> {
  return ref.dimapEither(f, Either.right);
}

/**
 * Transforms both the `set` and `get` values of the `Ref` with the
 * specified functions.
 *
 * @tsplus fluent fncts.control.Ref dimap
 * @tsplus fluent fncts.control.Ref.Synchronized dimap
 */
export function dimap_<RA, RB, EA, EB, A, B, C, D>(
  ref: PRef<RA, RB, EA, EB, A, B>,
  f: (_: C) => A,
  g: (_: B) => D,
): PRef<RA, RB, EA, EB, C, D> {
  return ref.dimapEither(
    (c) => Either.right(f(c)),
    (b) => Either.right(g(b)),
  );
}

/**
 * Transforms both the `set` and `get` values of the `Ref` with the
 * specified fallible functions.
 *
 * @tsplus fluent fncts.control.Ref dimapEither
 * @tsplus fluent fncts.control.Ref.Synchronized dimapEither
 */
export function dimapEither_<RA, RB, EA, EB, A, B, C, EC, D, ED>(
  ref: PRef<RA, RB, EA, EB, A, B>,
  f: (_: C) => Either<EC, A>,
  g: (_: B) => Either<ED, D>,
): PRef<RA, RB, EC | EA, ED | EB, C, D> {
  return ref.match(
    (ea: EA | EC) => ea,
    (eb: EB | ED) => eb,
    f,
    g,
  );
}

/**
 * Transforms both the `set` and `get` errors of the `Ref` with the
 * specified functions.
 *
 * @tsplus fluent fncts.control.Ref dimapError
 * @tsplus fluent fncts.control.Ref.Synchronized dimapError
 */
export function dimapError_<RA, RB, EA, EB, A, B, EC, ED>(
  ref: PRef<RA, RB, EA, EB, A, B>,
  f: (_: EA) => EC,
  g: (_: EB) => ED,
): PRef<RA, RB, EC, ED, A, B> {
  return ref.match(f, g, Either.right, Either.right);
}

/**
 * Transforms the `get` value of the `Ref` with the specified fallible
 * function.
 *
 * @tsplus fluent fncts.control.Ref mapEither
 * @tsplus fluent fncts.control.Ref.Synchronized mapEither
 */
export function mapEither_<RA, RB, EA, EB, A, B, EC, C>(
  ref: PRef<RA, RB, EA, EB, A, B>,
  f: (_: B) => Either<EC, C>,
): PRef<RA, RB, EA, EC | EB, A, C> {
  return ref.dimapEither(Either.right, f);
}

/**
 * Transforms the `get` value of the `Ref` with the specified function.
 *
 * @tsplus fluent fncts.control.Ref map
 * @tsplus fluent fncts.control.Ref.Synchronized map
 */
export function map_<RA, RB, EA, EB, A, B, C>(ref: PRef<RA, RB, EA, EB, A, B>, f: (_: B) => C): PRef<RA, RB, EA, EB, A, C> {
  return ref.mapEither((b) => Either.right(f(b)));
}
