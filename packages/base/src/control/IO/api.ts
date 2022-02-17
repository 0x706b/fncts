import type { Cause } from "../../data/Cause";
import type { Either } from "../../data/Either";
import type { Lazy } from "../../data/function";
import type { Trace } from "../../data/Trace";

import { Conc } from "../../collection/immutable/Conc";
import { Exit } from "../../data/Exit";
import { tuple } from "../../data/function";
import { Chain, Ensuring, IO, Match } from "./definition";

/**
 * @tsplus fluent fncts.control.IO as
 */
export function as_<R, E, A, B>(self: IO<R, E, A>, b: Lazy<B>): IO<R, E, B> {
  return self.map(() => b());
}

/**
 * @tsplus getter fncts.control.IO asUnit
 */
export function asUnit<R, E, A>(self: IO<R, E, A>): IO<R, E, void> {
  return self.as(undefined);
}

/**
 * Returns an IO that models the execution of this effect, followed by
 * the passing of its value to the specified continuation function `f`,
 * followed by the effect that it returns.
 *
 * @tsplus fluent fncts.control.IO chain
 */
export function chain_<R, E, A, R1, E1, B>(
  ma: IO<R, E, A>,
  f: (a: A) => IO<R1, E1, B>,
  __tsplusTrace?: string
): IO<R & R1, E | E1, B> {
  return new Chain(ma, f, __tsplusTrace);
}

/**
 * @tsplus fluent fncts.control.IO ensuring
 */
export function ensuring_<R, E, A, R1>(
  self: IO<R, E, A>,
  finalizer: IO<R1, never, any>,
  __tsplusTrace?: string
): IO<R & R1, E, A> {
  return new Ensuring(self, finalizer, __tsplusTrace);
}

function foreachUnitWithIndexLoop<A, R, E, B>(
  iterator: Iterator<A>,
  f: (i: number, a: A) => IO<R, E, B>,
  i = 0
): IO<R, E, void> {
  const next = iterator.next();
  return next.done
    ? IO.unit
    : f(i, next.value).chain(() =>
        foreachUnitWithIndexLoop(iterator, f, i + 1)
      );
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` and
 * returns the results in a new `Conc<B>`.
 *
 * For a parallel version of this method, see `foreachC`.
 * If you do not need the results, see `foreachUnit` for a more efficient implementation.
 *
 * @tsplus static fncts.control.IOOps foreach
 */
export function foreach_<A, R, E, B>(
  as: Iterable<A>,
  f: (a: A) => IO<R, E, B>,
  __tsplusTrace?: string
): IO<R, E, Conc<B>> {
  return IO.defer(() => {
    const acc: Array<B> = [];
    return IO.foreachUnitWithIndex(as, (_, a) =>
      f(a).chain((b) => {
        acc.push(b);
        return IO.unit;
      })
    ).as(Conc.from(acc));
  });
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` and
 * returns the results in a new `Conc<B>`.
 *
 * For a parallel version of this method, see `foreachC`.
 * If you do not need the results, see `foreachUnit` for a more efficient implementation.
 *
 * @tsplus static fncts.control.IOOps foreachWithIndex
 */
export function foreachWithIndex_<A, R, E, B>(
  as: Iterable<A>,
  f: (i: number, a: A) => IO<R, E, B>
): IO<R, E, Conc<B>> {
  return IO.defer(() => {
    const acc: Array<B> = [];
    return IO.foreachUnitWithIndex(as, (i, a) =>
      f(i, a).chain((b) => {
        acc.push(b);
        return IO.unit;
      })
    ).as(Conc.from(acc));
  });
}

/**
 * @tsplus static fncts.control.IOOps foreachUnitWithIndex
 */
export function foreachUnitWithIndex_<A, R, E, B>(
  as: Iterable<A>,
  f: (i: number, a: A) => IO<R, E, B>
): IO<R, E, void> {
  return IO.defer(foreachUnitWithIndexLoop(as[Symbol.iterator](), f));
}

/**
 * Applies the function `f` to each element of the `Iterable<A>` and runs
 * produced IOs sequentially.
 *
 * @tsplus static fncts.control.IOOps foreachUnit
 */
export function foreachUnit_<A, R, E, B>(
  as: Iterable<A>,
  f: (a: A) => IO<R, E, B>
): IO<R, E, void> {
  return IO.defer(
    foreachUnitWithIndexLoop(as[Symbol.iterator](), (_, a) => f(a))
  );
}

/**
 * Returns an `IO` whose success is mapped by the specified function `f`.
 *
 * @tsplus fluent fncts.control.IO map
 */
export function map_<R, E, A, B>(
  fa: IO<R, E, A>,
  f: (a: A) => B,
  __tsplusTrace?: string
): IO<R, E, B> {
  return fa.chain((a) => IO.succeedNow(f(a)));
}

/**
 * A more powerful version of `match_` that allows recovering from any kind of failure except interruptions.
 *
 * @tsplus fluent fncts.control.IO matchCause
 */
export function matchCause_<R, E, A, A1, A2>(
  self: IO<R, E, A>,
  onFailure: (cause: Cause<E>) => A1,
  onSuccess: (a: A) => A2,
  __tsplusTrace?: string
): IO<R, never, A1 | A2> {
  return self.matchCauseIO(
    (cause) => IO.succeedNow(onFailure(cause)),
    (a) => IO.succeedNow(onSuccess(a))
  );
}

/**
 * A more powerful version of `matchIO` that allows recovering from any kind of failure except interruptions.
 *
 * @tsplus fluent fncts.control.IO matchCauseIO
 */
export function matchCauseIO_<R, E, A, R1, E1, A1, R2, E2, A2>(
  self: IO<R, E, A>,
  onFailure: (cause: Cause<E>) => IO<R1, E1, A1>,
  onSuccess: (a: A) => IO<R2, E2, A2>,
  __tsplusTrace?: string
): IO<R & R1 & R2, E1 | E2, A1 | A2> {
  return new Match(self, onFailure, onSuccess, __tsplusTrace);
}

/**
 * @tsplus fluent fncts.control.IO matchIO
 */
export function matchIO_<R, R1, R2, E, E1, E2, A, A1, A2>(
  self: IO<R, E, A>,
  onFailure: (e: E) => IO<R1, E1, A1>,
  onSuccess: (a: A) => IO<R2, E2, A2>,
  __tsplusTrace?: string
): IO<R & R1 & R2, E1 | E2, A1 | A2> {
  return self.matchCauseIO(
    (cause) => cause.failureOrCause.match(onFailure, IO.failCauseNow),
    onSuccess
  );
}

/**
 * Folds over the failure value or the success value to yield an IO that
 * does not fail, but succeeds with the value returned by the left or right
 * function passed to `match_`.
 *
 * @tsplus fluent fncts.control.IO match
 */
export function match_<R, E, A, B, C>(
  self: IO<R, E, A>,
  onFailure: (e: E) => B,
  onSuccess: (a: A) => C,
  __tsplusTrace?: string
): IO<R, never, B | C> {
  return self.matchIO(
    (e) => IO.succeedNow(onFailure(e)),
    (a) => IO.succeedNow(onSuccess(a))
  );
}

/**
 * A version of `matchIO` that gives you the (optional) trace of the error.
 *
 * @tsplus fluent fncts.control.IO matchTraceIO
 */
export function matchTraceIO_<R, E, A, R1, E1, A1, R2, E2, A2>(
  ma: IO<R, E, A>,
  onFailure: (e: E, trace: Trace) => IO<R1, E1, A1>,
  onSuccess: (a: A) => IO<R2, E2, A2>,
  __tsplusTrace?: string
): IO<R & R1 & R2, E1 | E2, A1 | A2> {
  return ma.matchCauseIO(
    (cause) =>
      cause.failureTraceOrCause.match(
        ([e, trace]) => onFailure(e, trace),
        IO.failCauseNow
      ),
    onSuccess
  );
}

/**
 * Returns an IO that semantically runs the IO on a fiber,
 * producing an `Exit` for the completion value of the fiber.
 *
 * @tsplus getter fncts.control.IO result
 */
export function result<R, E, A>(
  ma: IO<R, E, A>,
  __tsplusTrace?: string
): IO<R, never, Exit<E, A>> {
  return ma.matchCauseIO(
    (cause) => IO.succeedNow(Exit.failCause(cause)),
    (a) => IO.succeedNow(Exit.succeed(a))
  );
}

/**
 * Returns an `IO` that submerges an `Either` into the `IO`.
 *
 * @tsplus getter fncts.control.IO absolve
 */
export function absolve<R, E, E1, A>(
  ma: IO<R, E, Either<E1, A>>,
  __tsplusTrace?: string
): IO<R, E | E1, A> {
  return ma.chain((ea) => ea.match(IO.failNow, IO.succeedNow));
}

/**
 * Composes computations in sequence, using the return value of one computation as input for the next
 * and keeping only the result of the first
 *
 * Returns an IO that effectfully "peeks" at the success of this effect.
 *
 * @tsplus fluent fncts.control.IO tap
 */
export function tap_<R, E, A, R1, E1, B>(
  self: IO<R, E, A>,
  f: (a: A) => IO<R1, E1, B>,
  __tsplusTrace?: string
): IO<R1 & R, E1 | E, A> {
  return self.chain((a) => f(a).map(() => a));
}

/**
 * @tsplus fluent fncts.control.IO zip
 */
export function zip_<R, E, A, R1, E1, B>(
  self: IO<R, E, A>,
  that: IO<R1, E1, B>
): IO<R & R1, E | E1, readonly [A, B]> {
  return self.zipWith(that, tuple);
}

/**
 * @tsplus fluent fncts.control.IO zipWith
 */
export function zipWith_<R, E, A, R1, E1, B, C>(
  self: IO<R, E, A>,
  that: IO<R1, E1, B>,
  f: (a: A, b: B) => C
): IO<R & R1, E | E1, C> {
  return self.chain((a) => that.map((b) => f(a, b)));
}
