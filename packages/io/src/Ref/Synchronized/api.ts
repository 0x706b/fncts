import type { PRef } from "../definition.js";

import { identity, tuple } from "@fncts/base/data/function";

import { concreteSynchronized } from "./definition.js";

/**
 * Maps and filters the `get` value of the `SRef` with the specified
 * effectual partial function, returning a `SRef` with a `get` value that
 * succeeds with the result of the partial function if it is defined or else
 * fails with `None`.
 *
 * @tsplus fluent fncts.control.Ref.Synchronized collectIO
 */
export function collectIO_<RA, RB, EA, EB, A, B, RC, EC, C>(
  ref: PRef.Synchronized<RA, RB, EA, EB, A, B>,
  f: (b: B) => Maybe<IO<RC, EC, C>>,
): PRef.Synchronized<RA, RB & RC, EA, Maybe<EB | EC>, A, C> {
  return ref.matchIO(
    identity,
    (eb) => Just<EB | EC>(eb),
    IO.succeedNow,
    (b) =>
      f(b)
        .map((a) => a.asJustError)
        .getOrElse(IO.failNow(Nothing())),
  );
}

/**
 * Transforms the `set` value of the `SRef` with the specified effectual
 * function.
 *
 * @tsplus fluent fncts.control.Ref.Synchronized contramapIO
 */
export function contramapIO_<RA, RB, EA, EB, B, A, RC, EC, C>(
  ref: PRef.Synchronized<RA, RB, EA, EB, A, B>,
  f: (c: C) => IO<RC, EC, A>,
): PRef.Synchronized<RA & RC, RB, EC | EA, EB, C, B> {
  return ref.dimapIO(f, IO.succeedNow);
}

/**
 * Transforms both the `set` and `get` values of the `Synchronized` with the
 * specified effectual functions.
 *
 * @tsplus fluent fncts.control.Ref.Synchronized dimapIO
 */
export function dimapIO_<RA, RB, EA, EB, B, RC, EC, A, RD, ED, C = A, D = B>(
  ref: PRef.Synchronized<RA, RB, EA, EB, A, B>,
  f: (c: C) => IO<RC, EC, A>,
  g: (b: B) => IO<RD, ED, D>,
): PRef.Synchronized<RA & RC, RB & RD, EA | EC, EB | ED, C, D> {
  return ref.matchIO(
    (ea: EA | EC) => ea,
    (eb: EB | ED) => eb,
    f,
    g,
  );
}

/**
 * Filters the `set` value of the `SRef` with the specified effectual
 * predicate, returning a `SRef` with a `set` value that succeeds if the
 * predicate is satisfied or else fails with `None`.
 *
 * @tsplus fluent fncts.control.Ref.Synchronized filterInputIO
 */
export function filterInputIO_<RA, RB, EA, EB, B, A, RC, EC, A1 extends A = A>(
  ref: PRef.Synchronized<RA, RB, EA, EB, A, B>,
  f: (a: A1) => IO<RC, EC, boolean>,
): PRef.Synchronized<RA & RC, RB, Maybe<EC | EA>, EB, A1, B> {
  return ref.matchIO(
    (ea) => Just(ea),
    identity,
    (a) => f(a).asJustError.ifIO(IO.failNow(Nothing()), IO.succeedNow(a)),
    IO.succeedNow,
  );
}

/**
 * Filters the `get` value of the `SRef` with the specified effectual predicate,
 * returning a `SRef` with a `get` value that succeeds if the predicate is
 * satisfied or else fails with `None`.
 *
 * @tsplus fluent fncts.control.Ref.Synchronized filterOutputIO
 */
export function filterOutputIO_<RA, RB, EA, EB, A, B, RC, EC>(
  ref: PRef.Synchronized<RA, RB, EA, EB, A, B>,
  f: (b: B) => IO<RC, EC, boolean>,
): PRef.Synchronized<RA, RB & RC, EA, Maybe<EC | EB>, A, B> {
  return ref.matchIO(identity, Maybe.just, IO.succeedNow, (b) =>
    f(b).asJustError.ifIO(IO.succeedNow(b), IO.failNow(Nothing())),
  );
}

/**
 * Atomically modifies the `Synchronized` with the specified function, returning the
 * value immediately before modification.
 */
export function getAndUpdateIO_<RA, RB, EA, EB, R1, E1, A>(
  ref: PRef.Synchronized<RA, RB, EA, EB, A, A>,
  f: (a: A) => IO<R1, E1, A>,
): IO<RA & RB & R1, EA | EB | E1, A> {
  return ref.modifyIO((a) => f(a).map((r) => [a, r]));
}

/**
 * Atomically modifies the `SRef` with the specified function, returning the
 * value immediately before modification.
 */
export function getAndUpdateJustIO_<RA, RB, EA, EB, R1, E1, A>(
  ref: PRef.Synchronized<RA, RB, EA, EB, A, A>,
  f: (a: A) => Maybe<IO<R1, E1, A>>,
): IO<RA & RB & R1, EA | EB | E1, A> {
  return ref.modifyIO((a) =>
    f(a)
      .getOrElse(IO.succeedNow(a))
      .map((r) => [a, r]),
  );
}

/**
 * @tsplus fluent fncts.control.Ref.Synchronized matchIO
 */
export function matchIO_<RA, RB, EA, EB, A, B, RC, RD, EC, ED, C, D>(
  self: PRef.Synchronized<RA, RB, EA, EB, A, B>,
  ea: (_: EA) => EC,
  eb: (_: EB) => ED,
  ca: (_: C) => IO<RC, EC, A>,
  bd: (_: B) => IO<RD, ED, D>,
  __tsplusTrace?: string,
): PRef.Synchronized<RA & RC, RB & RD, EC, ED, C, D> {
  return self.matchIO(ea, eb, ca, bd);
}

/**
 * @tsplus fluent fncts.control.Ref.Synchronized matchAllIO
 */
export function matchAllIO_<RA, RB, EA, EB, A, B, RC, RD, EC, ED, C, D>(
  self: PRef.Synchronized<RA, RB, EA, EB, A, B>,
  ea: (_: EA) => EC,
  eb: (_: EB) => ED,
  ec: (_: EB) => EC,
  ca: (_: C) => (_: B) => IO<RC, EC, A>,
  bd: (_: B) => IO<RD, ED, D>,
  __tsplusTrace?: string,
): PRef.Synchronized<RA & RB & RC, RB & RD, EC, ED, C, D> {
  return self.matchAllIO(ea, eb, ec, ca, bd);
}

/**
 * @tsplus fluent fncts.control.Ref.Synchronized modifyIO
 */
export function modifyIO_<RA, RB, EA, EB, A, R1, E1, B>(
  self: PRef.Synchronized<RA, RB, EA, EB, A, A>,
  f: (a: A) => IO<R1, E1, readonly [B, A]>,
  __tsplusTrace?: string,
): IO<RA & RB & R1, EA | EB | E1, B> {
  concreteSynchronized(self);
  return self.withPermit(self.unsafeGet.chain(f).chain(([b, a]) => self.unsafeSet(a).as(b)));
}

/**
 * Atomically modifies the `Synchronized` with the specified function, which computes
 * a return value for the modification if the function is defined in the current value
 * otherwise it returns a default value.
 * This is a more powerful version of `updateJust`.
 *
 * @tsplus fluent fncts.control.Ref.Synchronized modifyJustIO
 */
export function modifyJustIO_<RA, RB, EA, EB, R1, E1, A, B>(
  ref: PRef.Synchronized<RA, RB, EA, EB, A, A>,
  def: B,
  f: (a: A) => Maybe<IO<R1, E1, readonly [B, A]>>,
): IO<RA & RB & R1, EA | EB | E1, B> {
  return ref.modifyIO((a) => f(a).getOrElse(IO.succeedNow(tuple(def, a))));
}

/**
 * Atomically modifies the `SRef` with the specified function.
 *
 * @tsplus fluent fncts.control.Ref.Synchronized updateAndGetIO
 */
export function updateAndGetIO_<RA, RB, EA, EB, R1, E1, A>(
  ref: PRef.Synchronized<RA, RB, EA, EB, A, A>,
  f: (a: A) => IO<R1, E1, A>,
): IO<RA & RB & R1, E1 | EA | EB, void> {
  return ref.modifyIO((a) => f(a).map((r) => [r, r])).asUnit;
}

/**
 * Atomically modifies the `Synchronized` with the specified function.
 *
 * @tsplus fluent fncts.control.Ref.Synchronized updateIO
 */
export function updateIO_<RA, RB, EA, EB, R1, E1, A>(
  ref: PRef.Synchronized<RA, RB, EA, EB, A, A>,
  f: (a: A) => IO<R1, E1, A>,
): IO<RA & RB & R1, E1 | EA | EB, void> {
  return ref.modifyIO((a) => f(a).map((r) => [undefined, r]));
}

/**
 * Atomically modifies the `SRef` with the specified function.
 *
 * @tsplus fluent fncts.control.Ref.Synchronized updateJustAndGetIO
 */
export function updateJustAndGetIO_<RA, RB, EA, EB, R1, E1, A>(
  ref: PRef.Synchronized<RA, RB, EA, EB, A, A>,
  f: (a: A) => Maybe<IO<R1, E1, A>>,
): IO<RA & RB & R1, E1 | EA | EB, A> {
  return ref.modifyIO((a) =>
    f(a)
      .getOrElse(IO.succeedNow(a))
      .map((r) => [r, r]),
  );
}

/**
 * Atomically modifies the `SRef` with the specified function.
 *
 * @tsplus fluent fncts.control.Ref.Synchronized updateJustIO
 */
export function updateJustIO_<RA, RB, EA, EB, R1, E1, A>(
  ref: PRef.Synchronized<RA, RB, EA, EB, A, A>,
  f: (a: A) => Maybe<IO<R1, E1, A>>,
): IO<RA & RB & R1, E1 | EA | EB, void> {
  return ref.modifyIO((a) =>
    f(a)
      .getOrElse(IO.succeedNow(a))
      .map((r) => [undefined, r]),
  );
}
