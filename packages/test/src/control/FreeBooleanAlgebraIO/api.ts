import type { FreeBooleanAlgebraIO } from "./definition.js";

import { FreeBooleanAlgebra } from "../../data/FreeBooleanAlgebra.js";

/**
 * @tsplus pipeable fncts.test.FreeBooleanAlgebraIO and
 * @tsplus pipeable-operator fncts.test.FreeBooleanAlgebraIO &&
 */
export function and<R1, E1, A1>(that: FreeBooleanAlgebraIO<R1, E1, A1>) {
  return <R, E, A extends A1>(self: FreeBooleanAlgebraIO<R, E, A>): FreeBooleanAlgebraIO<R | R1, E | E1, A | A1> => {
    return self.zipWith(that, (a, b) => a && b);
  };
}

/**
 * @tsplus pipeable fncts.test.FreeBooleanAlgebraIO or
 * @tsplus pipeable-operator fncts.test.FreeBooleanAlgebraIO ||
 */
export function or<R1, E1, A1>(that: FreeBooleanAlgebraIO<R1, E1, A1>) {
  return <R, E, A extends A1>(self: FreeBooleanAlgebraIO<R, E, A>): FreeBooleanAlgebraIO<R | R1, E | E1, A | A1> => {
    return self.zipWith(that, (a, b) => a || b);
  };
}

/**
 * @tsplus fluent fncts.test.FreeBooleanAlgebraIO invert
 */
export function not<R, E, A>(self: FreeBooleanAlgebraIO<R, E, A>): FreeBooleanAlgebraIO<R, E, A> {
  return self.map((a) => a.invert);
}

/**
 * @tsplus getter fncts.test.FreeBooleanAlgebraIO isSuccess
 */
export function isSuccess<R, E, A>(self: FreeBooleanAlgebraIO<R, E, A>): IO<R, E, boolean> {
  return self.map((a) => a.isSuccess);
}

/**
 * @tsplus getter fncts.test.FreeBooleanAlgebraIO isFailure
 */
export function isFailure<R, E, A>(self: FreeBooleanAlgebraIO<R, E, A>): IO<R, E, boolean> {
  return self.map((a) => a.isFailure);
}

/**
 * @tsplus static fncts.test.FreeBooleanAlgebraIOOps success
 */
export function success<A>(a: A): FreeBooleanAlgebraIO<never, never, A> {
  return IO.succeedNow(FreeBooleanAlgebra.success(a));
}

/**
 * @tsplus static fncts.test.FreeBooleanAlgebraIOOps failure
 */
export function failure<A>(a: A): FreeBooleanAlgebraIO<never, never, A> {
  return IO.succeedNow(FreeBooleanAlgebra.failure(a));
}

/**
 * @tsplus static fncts.test.FreeBooleanAlgebraIOOps fromIO
 */
export function fromIO<R, E, A>(io: IO<R, E, A>): FreeBooleanAlgebraIO<R, E, A> {
  return io.map(FreeBooleanAlgebra.success);
}
