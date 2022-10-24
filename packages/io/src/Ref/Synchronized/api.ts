import type { PRef } from "../definition.js";

import { identity, tuple } from "@fncts/base/data/function";

import { concreteSynchronized } from "./definition.js";

/**
 * Maps and filters the `get` value of the `SRef` with the specified
 * effectual partial function, returning a `SRef` with a `get` value that
 * succeeds with the result of the partial function if it is defined or else
 * fails with `None`.
 *
 * @tsplus pipeable fncts.io.Ref.Synchronized collectIO
 */
export function collectIO<B, RC, EC, C>(f: (b: B) => Maybe<IO<RC, EC, C>>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A>(
    ref: PRef.Synchronized<RA, RB, EA, EB, A, B>,
  ): PRef.Synchronized<RA, RB | RC, EA, Maybe<EB | EC>, A, C> => {
    return ref.matchIO(
      identity,
      (eb) => Just<EB | EC>(eb),
      IO.succeedNow,
      (b) =>
        f(b)
          .map((a) => a.asJustError)
          .getOrElse(IO.failNow(Nothing())),
    );
  };
}

/**
 * Transforms the `set` value of the `SRef` with the specified effectual
 * function.
 *
 * @tsplus pipeable fncts.io.Ref.Synchronized contramapIO
 */
export function contramapIO<A, RC, EC, C>(f: (c: C) => IO<RC, EC, A>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, B>(
    ref: PRef.Synchronized<RA, RB, EA, EB, A, B>,
  ): PRef.Synchronized<RA | RC, RB, EC | EA, EB, C, B> => {
    return ref.dimapIO(f, IO.succeedNow);
  };
}

/**
 * Transforms both the `set` and `get` values of the `Synchronized` with the
 * specified effectual functions.
 *
 * @tsplus pipeable fncts.io.Ref.Synchronized dimapIO
 */
export function dimapIO<A, B, RC, EC, RD, ED, C = A, D = B>(
  f: (c: C) => IO<RC, EC, A>,
  g: (b: B) => IO<RD, ED, D>,
  __tsplusTrace?: string,
) {
  return <RA, RB, EA, EB>(
    ref: PRef.Synchronized<RA, RB, EA, EB, A, B>,
  ): PRef.Synchronized<RA | RC, RB | RD, EA | EC, EB | ED, C, D> => {
    return ref.matchIO(
      (ea: EA | EC) => ea,
      (eb: EB | ED) => eb,
      f,
      g,
    );
  };
}

/**
 * Filters the `set` value of the `SRef` with the specified effectual
 * predicate, returning a `SRef` with a `set` value that succeeds if the
 * predicate is satisfied or else fails with `None`.
 *
 * @tsplus pipeable fncts.io.Ref.Synchronized filterInputIO
 */
export function filterInputIO<RA, RB, EA, EB, B, A, RC, EC, A1 extends A = A>(
  f: (a: A1) => IO<RC, EC, boolean>,
  __tsplusTrace?: string,
) {
  return (self: PRef.Synchronized<RA, RB, EA, EB, A, B>): PRef.Synchronized<RA | RC, RB, Maybe<EC | EA>, EB, A1, B> => {
    return self.matchIO(
      (ea): Maybe<EC | EA> => Just(ea),
      identity,
      (a) => f(a).asJustError.ifIO(IO.failNow(Nothing()), IO.succeedNow(a)),
      IO.succeedNow,
    );
  };
}

/**
 * Filters the `get` value of the `SRef` with the specified effectual predicate,
 * returning a `SRef` with a `get` value that succeeds if the predicate is
 * satisfied or else fails with `None`.
 *
 * @tsplus pipeable fncts.io.Ref.Synchronized filterOutputIO
 */
export function filterOutputIO<B, RC, EC>(f: (b: B) => IO<RC, EC, boolean>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A>(
    ref: PRef.Synchronized<RA, RB, EA, EB, A, B>,
  ): PRef.Synchronized<RA, RB | RC, EA, Maybe<EC | EB>, A, B> => {
    return ref.matchIO(
      identity,
      (eb): Maybe<EC | EB> => Maybe.just(eb),
      IO.succeedNow,
      (b) => f(b).asJustError.ifIO(IO.succeedNow(b), IO.failNow(Nothing())),
    );
  };
}

/**
 * Atomically modifies the `Synchronized` with the specified function, returning the
 * value immediately before modification.
 *
 * @tsplus pipeable fncts.io.Ref.Synchronized getAndUpdateIO
 */
export function getAndUpdateIO<A, R1, E1>(f: (a: A) => IO<R1, E1, A>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(ref: PRef.Synchronized<RA, RB, EA, EB, A, A>): IO<RA | RB | R1, EA | EB | E1, A> => {
    return ref.modifyIO((a) => f(a).map((r) => [a, r]));
  };
}

/**
 * Atomically modifies the `Synchronized` with the specified function, returning the
 * value immediately before modification.
 */
export function getAndUpdateJustIO<A, R1, E1>(f: (a: A) => Maybe<IO<R1, E1, A>>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(ref: PRef.Synchronized<RA, RB, EA, EB, A, A>): IO<RA | RB | R1, EA | EB | E1, A> => {
    return ref.modifyIO((a) =>
      f(a)
        .getOrElse(IO.succeedNow(a))
        .map((r) => [a, r]),
    );
  };
}

/**
 * @tsplus pipeable fncts.io.Ref.Synchronized matchIO
 */
export function matchIO<EA, EB, A, B, RC, RD, EC, ED, C, D>(
  ea: (_: EA) => EC,
  eb: (_: EB) => ED,
  ca: (_: C) => IO<RC, EC, A>,
  bd: (_: B) => IO<RD, ED, D>,
  __tsplusTrace?: string,
) {
  return <RA, RB>(self: PRef.Synchronized<RA, RB, EA, EB, A, B>): PRef.Synchronized<RA | RC, RB | RD, EC, ED, C, D> => {
    concreteSynchronized(self);
    return self.matchIO(ea, eb, ca, bd);
  };
}

/**
 * @tsplus pipeable fncts.io.Ref.Synchronized matchAllIO
 */
export function matchAllIO<EA, EB, A, B, RC, RD, EC, ED, C, D>(
  ea: (_: EA) => EC,
  eb: (_: EB) => ED,
  ec: (_: EB) => EC,
  ca: (_: C) => (_: B) => IO<RC, EC, A>,
  bd: (_: B) => IO<RD, ED, D>,
  __tsplusTrace?: string,
) {
  return <RA, RB>(
    self: PRef.Synchronized<RA, RB, EA, EB, A, B>,
  ): PRef.Synchronized<RA | RB | RC, RB | RD, EC, ED, C, D> => {
    concreteSynchronized(self);
    return self.matchAllIO(ea, eb, ec, ca, bd);
  };
}

/**
 * @tsplus pipeable fncts.io.Ref.Synchronized modifyIO
 */
export function modifyIO<A, R1, E1, B>(f: (a: A) => IO<R1, E1, readonly [B, A]>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(self: PRef.Synchronized<RA, RB, EA, EB, A, A>): IO<RA | RB | R1, EA | EB | E1, B> => {
    concreteSynchronized(self);
    return self.modifyIO(f);
  };
}

/**
 * Atomically modifies the `Synchronized` with the specified function, which computes
 * a return value for the modification if the function is defined in the current value
 * otherwise it returns a default value.
 * This is a more powerful version of `updateJust`.
 *
 * @tsplus pipeable fncts.io.Ref.Synchronized modifyJustIO
 */
export function modifyJustIO<A, R1, E1, B>(
  def: B,
  f: (a: A) => Maybe<IO<R1, E1, readonly [B, A]>>,
  __tsplusTrace?: string,
) {
  return <RA, RB, EA, EB>(ref: PRef.Synchronized<RA, RB, EA, EB, A, A>): IO<RA | RB | R1, EA | EB | E1, B> => {
    return ref.modifyIO((a) => f(a).getOrElse(IO.succeedNow(tuple(def, a))));
  };
}

/**
 * Atomically modifies the `SRef` with the specified function.
 *
 * @tsplus pipeable fncts.io.Ref.Synchronized updateAndGetIO
 */
export function updateAndGetIO<A, R1, E1>(f: (a: A) => IO<R1, E1, A>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(ref: PRef.Synchronized<RA, RB, EA, EB, A, A>): IO<RA | RB | R1, E1 | EA | EB, void> => {
    return ref.modifyIO((a) => f(a).map((r) => [r, r])).asUnit;
  };
}

/**
 * Atomically modifies the `Synchronized` with the specified function.
 *
 * @tsplus pipeable fncts.io.Ref.Synchronized updateIO
 */
export function updateIO<A, R1, E1>(f: (a: A) => IO<R1, E1, A>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(ref: PRef.Synchronized<RA, RB, EA, EB, A, A>): IO<RA | RB | R1, E1 | EA | EB, void> => {
    return ref.modifyIO((a) => f(a).map((r) => [undefined, r]));
  };
}

/**
 * Atomically modifies the `SRef` with the specified function.
 *
 * @tsplus pipeable fncts.io.Ref.Synchronized updateJustAndGetIO
 */
export function updateJustAndGetIO<A, R1, E1>(f: (a: A) => Maybe<IO<R1, E1, A>>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(ref: PRef.Synchronized<RA, RB, EA, EB, A, A>): IO<RA | RB | R1, E1 | EA | EB, A> => {
    return ref.modifyIO((a) =>
      f(a)
        .getOrElse(IO.succeedNow(a))
        .map((r) => [r, r]),
    );
  };
}

/**
 * Atomically modifies the `SRef` with the specified function.
 *
 * @tsplus pipeable fncts.io.Ref.Synchronized updateJustIO
 */
export function updateJustIO<A, R1, E1>(f: (a: A) => Maybe<IO<R1, E1, A>>, __tsplusTrace?: string) {
  return <RA, RB, EA, EB>(ref: PRef.Synchronized<RA, RB, EA, EB, A, A>): IO<RA | RB | R1, E1 | EA | EB, void> => {
    return ref.modifyIO((a) =>
      f(a)
        .getOrElse(IO.succeedNow(a))
        .map((r) => [undefined, r]),
    );
  };
}
