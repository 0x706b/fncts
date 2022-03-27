import type { FreeBooleanAlgebraIO } from "./definition.js";

import { FreeBooleanAlgebra } from "../../data/FreeBooleanAlgebra.js";

/**
 * @tsplus fluent fncts.test.control.FreeBooleanAlgebraIO and
 * @tsplus operator fncts.test.control.FreeBooleanAlgebraIO &&
 */
export function and_<R, E, A extends A1, R1, E1, A1>(
  self: FreeBooleanAlgebraIO<R, E, A>,
  that: FreeBooleanAlgebraIO<R1, E1, A1>,
): FreeBooleanAlgebraIO<R & R1, E | E1, A | A1> {
  return self.zipWith(that, (a, b) => a && b);
}

/**
 * @tsplus fluent fncts.test.control.FreeBooleanAlgebraIO or
 * @tsplus operator fncts.test.control.FreeBooleanAlgebraIO ||
 */
export function or_<R, E, A extends A1, R1, E1, A1>(
  self: FreeBooleanAlgebraIO<R, E, A>,
  that: FreeBooleanAlgebraIO<R1, E1, A1>,
): FreeBooleanAlgebraIO<R & R1, E | E1, A | A1> {
  return self.zipWith(that, (a, b) => a || b);
}

/**
 * @tsplus fluent fncts.test.control.FreeBooleanAlgebraIO invert
 */
export function not<R, E, A>(self: FreeBooleanAlgebraIO<R, E, A>): FreeBooleanAlgebraIO<R, E, A> {
  return self.map((a) => a.invert);
}

/**
 * @tsplus getter fncts.test.control.FreeBooleanAlgebraIO isSuccess
 */
export function isSuccess<R, E, A>(self: FreeBooleanAlgebraIO<R, E, A>): IO<R, E, boolean> {
  return self.map((a) => a.isSuccess);
}

/**
 * @tsplus getter fncts.test.control.FreeBooleanAlgebraIO isFailure
 */
export function isFailure<R, E, A>(self: FreeBooleanAlgebraIO<R, E, A>): IO<R, E, boolean> {
  return self.map((a) => a.isFailure);
}

/**
 * @tsplus static fncts.test.control.FreeBooleanAlgebraIOOps success
 */
export function success<A>(a: A): FreeBooleanAlgebraIO<unknown, never, A> {
  return IO.succeedNow(FreeBooleanAlgebra.success(a));
}

/**
 * @tsplus static fncts.test.control.FreeBooleanAlgebraIOOps failure
 */
export function failure<A>(a: A): FreeBooleanAlgebraIO<unknown, never, A> {
  return IO.succeedNow(FreeBooleanAlgebra.failure(a));
}

/**
 * @tsplus static fncts.test.control.FreeBooleanAlgebraIOOps fromIO
 */
export function fromIO<R, E, A>(io: IO<R, E, A>): FreeBooleanAlgebraIO<R, E, A> {
  return io.map(FreeBooleanAlgebra.success);
}
