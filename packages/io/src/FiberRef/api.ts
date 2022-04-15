import { matchTag_ } from "@fncts/base//util/pattern";
import { identity, tuple } from "@fncts/base/data/function";
import { concrete } from "@fncts/io/FiberRef/definition";

/**
 * @tsplus fluent fncts.control.FiberRef modify
 */
export function modify_<EA, EB, A, B>(self: PFiberRef<EA, EB, A, A>, f: (a: A) => readonly [B, A]): FIO<EA | EB, B> {
  concrete(self);
  return matchTag_(self, {
    Runtime: (_) => _.modify(f),
    Derived: (_) =>
      _.use(
        (value, getEither, setEither) =>
          value.modify((s) =>
            getEither(s).match(
              (e) => tuple(Either.left(e), s),
              (a1) => {
                const [b, a2] = f(a1);
                return setEither(a2).match(
                  (e) => tuple(Either.left<EA | EB, B>(e), s),
                  (s) => tuple(Either.right(b), s),
                );
              },
            ),
          ).absolve,
      ),
    DerivedAll: (_) =>
      _.use(
        (value, getEither, setEither) =>
          value.modify((s) =>
            getEither(s).match(
              (e) => tuple(Either.left(e), s),
              (a1) => {
                const [b, a2] = f(a1);
                return setEither(a2)(s).match(
                  (e) => tuple(Either.left<EA | EB, B>(e), s),
                  (s) => tuple(Either.right(b), s),
                );
              },
            ),
          ).absolve,
      ),
  });
}

/**
 * @tsplus fluent fncts.control.FiberRef update
 */
export function update_<EA, EB, A>(fiberRef: PFiberRef<EA, EB, A, A>, f: (a: A) => A): FIO<EA | EB, void> {
  return fiberRef.modify((a) => [undefined, f(a)]);
}

/**
 * @tsplus fluent fncts.control.FiberRef set
 */
export function set_<EA, EB, A>(fiberRef: PFiberRef<EA, EB, A, A>, a: A): FIO<EA, void> {
  return fiberRef.set(a);
}

/**
 * @tsplus getter fncts.control.FiberRef get
 */
export function get<EA, EB, A, B>(fiberRef: PFiberRef<EA, EB, A, B>): FIO<EB, B> {
  return fiberRef.get;
}

/**
 * @tsplus fluent fncts.control.FiberRef getAndSet
 */
export function getAndSet_<EA, EB, A>(fiberRef: PFiberRef<EA, EB, A, A>, a: A): FIO<EA | EB, A> {
  return fiberRef.modify((v) => [v, a]);
}

/**
 * @tsplus fluent fncts.control.FiberRef getAndUpdate
 */
export function getAndUpdate_<EA, EB, A>(fiberRef: PFiberRef<EA, EB, A, A>, f: (a: A) => A): FIO<EA | EB, A> {
  return fiberRef.modify((a) => [a, f(a)]);
}

/**
 * @tsplus fluent fncts.control.FiberRef getAndUpdateJust
 */
export function getAndUpdateJust_<EA, EB, A>(
  fiberRef: PFiberRef<EA, EB, A, A>,
  f: (a: A) => Maybe<A>,
): FIO<EA | EB, A> {
  return fiberRef.modify((a) => [a, f(a).getOrElse(a)]);
}

/**
 * Returns an `IO` that runs with `value` bound to the current fiber.
 *
 * Guarantees that fiber data is properly restored via `bracket`.
 *
 * @tsplus fluent fncts.control.FiberRef locally
 */
export function locally_<EA, EB, A, B>(fiberRef: PFiberRef<EA, EB, A, B>, value: A) {
  return <R1, E1, C>(use: IO<R1, E1, C>): IO<R1, EA | E1, C> => {
    return fiberRef.locally(value)(use);
  };
}

/**
 * Returns an `IO` that runs with `f` applied to the current fiber.
 *
 * Guarantees that fiber data is properly restored via `bracket`.
 *
 * @tsplus fluent fncts.control.FiberRef locallyWith
 */
export function locallyWith_<EA, EB, A>(self: PFiberRef<EA, EB, A, A>, f: (a: A) => A) {
  return <R1, E1, C>(use: IO<R1, E1, C>): IO<R1, EA | EB | E1, C> => self.getWith((a) => self.locally(f(a))(use));
}

/**
 * @tsplus fluent fncts.control.FiberRef getWith
 */
export function getWith_<EA, EB, A, B, R, E, C>(
  fiberRef: PFiberRef<EA, EB, A, B>,
  f: (b: B) => IO<R, E, C>,
): IO<R, EB | E, C> {
  return fiberRef.getWith(f);
}

/*
 * -------------------------------------------------------------------------------------------------
 * Folds
 * -------------------------------------------------------------------------------------------------
 */

/**
 * @tsplus fluent fncts.control.FiberRef match
 */
export function match_<EA, EB, A, B, EC, ED, C, D>(
  ref: PFiberRef<EA, EB, A, B>,
  ea: (_: EA) => EC,
  eb: (_: EB) => ED,
  ca: (_: C) => Either<EC, A>,
  bd: (_: B) => Either<ED, D>,
): PFiberRef<EC, ED, C, D> {
  return ref.match(ea, eb, ca, bd);
}

/**
 * @tsplus fluent fncts.control.FiberRef matchAll
 */
export function matchAll_<EA, EB, A, B, EC, ED, C, D>(
  ref: PFiberRef<EA, EB, A, B>,
  ea: (_: EA) => EC,
  eb: (_: EB) => ED,
  ec: (_: EB) => EC,
  ca: (_: C) => (_: B) => Either<EC, A>,
  bd: (_: B) => Either<ED, D>,
): PFiberRef<EC, ED, C, D> {
  return ref.matchAll(ea, eb, ec, ca, bd);
}

/*
 * -------------------------------------------------------------------------------------------------
 * Profunctor
 * -------------------------------------------------------------------------------------------------
 */

/**
 * @tsplus fluent fncts.control.FiberRef dimapEither
 */
export function dimapEither_<EA, EB, A, B, EC, ED, C, D>(
  ref: PFiberRef<EA, EB, A, B>,
  f: (inp: C) => Either<EC, A>,
  g: (out: B) => Either<ED, D>,
): PFiberRef<EA | EC, EB | ED, C, D> {
  return ref.match(
    (ea: EA | EC) => ea,
    (eb: EB | ED) => eb,
    f,
    g,
  );
}

/**
 * @tsplus fluent fncts.control.FiberRef dimap
 */
export function dimap_<EA, EB, A, B, C, D>(
  ref: PFiberRef<EA, EB, A, B>,
  f: (inp: C) => A,
  g: (out: B) => D,
): PFiberRef<EA, EB, C, D> {
  return ref.dimapEither(
    (c) => Either.right(f(c)),
    (b) => Either.right(g(b)),
  );
}

/**
 * @tsplus fluent fncts.control.FiberRef dimapError
 */
export function dimapError_<EA, EB, A, B, EC, ED>(
  ref: PFiberRef<EA, EB, A, B>,
  f: (inpError: EA) => EC,
  g: (outError: EB) => ED,
): PFiberRef<EC, ED, A, B> {
  return ref.match(f, g, Either.right, Either.right);
}

/*
 * -------------------------------------------------------------------------------------------------
 * Contravariant
 * -------------------------------------------------------------------------------------------------
 */

/**
 * @tsplus fluent fncts.control.FiberRef contramapEither
 */
export function contramapEither_<EA, EB, A, B, EC, C>(
  ref: PFiberRef<EA, EB, A, B>,
  f: (inp: C) => Either<EC, A>,
): PFiberRef<EA | EC, EB, C, B> {
  return ref.dimapEither(f, Either.right);
}

/**
 * @tsplus fluent fncts.control.FiberRef contramap
 */
export function contramap_<EA, EB, A, B, C>(ref: PFiberRef<EA, EB, A, B>, f: (inp: C) => A): PFiberRef<EA, EB, C, B> {
  return ref.contramapEither((c) => Either.right(f(c)));
}

/*
 * -------------------------------------------------------------------------------------------------
 * Filter
 * -------------------------------------------------------------------------------------------------
 */

/**
 * @tsplus fluent fncts.control.FiberRef filterMap
 */
export function filterMap_<EA, EB, A, B, C>(
  ref: PFiberRef<EA, EB, A, B>,
  f: (b: B) => Maybe<C>,
): PFiberRef<EA, Maybe<EB>, A, C> {
  return ref.match(identity, Maybe.just, Either.right, (b) => f(b).match(() => Either.left(Nothing()), Either.right));
}

/**
 * @tsplus fluent fncts.control.FiberRef filterInput
 */
export function filterInput_<EA, EB, A, B>(
  ref: PFiberRef<EA, EB, A, B>,
  p: Predicate<A>,
): PFiberRef<Maybe<EA>, EB, A, B> {
  return ref.match(Maybe.just, identity, (a) => (p(a) ? Either.right(a) : Either.left(Nothing())), Either.right);
}

/**
 * @tsplus fluent fncts.control.FiberRef filterOutput
 */
export function filterOutput_<EA, EB, A, B>(
  ref: PFiberRef<EA, EB, A, B>,
  p: Predicate<B>,
): PFiberRef<EA, Maybe<EB>, A, B> {
  return ref.match(identity, Maybe.just, Either.right, (b) => (p(b) ? Either.right(b) : Either.left(Nothing())));
}

/*
 * -------------------------------------------------------------------------------------------------
 * Functor
 * -------------------------------------------------------------------------------------------------
 */

/**
 * @tsplus fluent fncts.control.FiberRef mapEither
 */
export function mapEither_<EA, EB, A, B, EC, C>(
  ref: PFiberRef<EA, EB, A, B>,
  f: (out: B) => Either<EC, C>,
): PFiberRef<EA, EB | EC, A, C> {
  return ref.dimapEither(Either.right, f);
}

/**
 * @tsplus fluent fncts.control.FiberRef map
 */
export function map_<EA, EB, A, B, C>(ref: PFiberRef<EA, EB, A, B>, f: (out: B) => C): PFiberRef<EA, EB, A, C> {
  return ref.mapEither((b) => Either.right(f(b)));
}

/*
 * -------------------------------------------------------------------------------------------------
 * util
 * -------------------------------------------------------------------------------------------------
 */

/**
 * @optimize identity
 */
export function readOnly<EA, EB, A, B>(ref: PFiberRef<EA, EB, A, B>): PFiberRef<EA, EB, never, B> {
  return ref;
}

export function writeOnly<EA, EB, A, B>(ref: PFiberRef<EA, EB, A, B>): PFiberRef<EA, void, A, never> {
  return match_(
    ref,
    identity,
    () => undefined,
    Either.right,
    () => Either.left(undefined),
  );
}
