import type { FiberId } from "../FiberId";
import type { Cause } from "./definition";

import { Trace } from "../Trace";
import { _Empty, Both, Fail, Halt, Interrupt, Then } from "./definition";

/**
 * The empty `Cause`
 *
 * @tsplus static fncts.data.CauseOps empty
 * @tsplus static fncts.data.Cause.EmptyOps __call
 */
export function empty<A>(): Cause<A> {
  return _Empty;
}

/**
 * Constructs a `Cause` from a single value, representing a typed failure
 *
 * @tsplus static fncts.data.CauseOps fail
 * @tsplus static fncts.data.Cause.FailOps __call
 */
export function fail<E = never>(value: E, trace: Trace = Trace.none): Cause<E> {
  return new Fail(value, trace);
}

/**
 * Constructs a `Cause` from a `Cause` and a stack trace.
 *
 * @note If the stack trace is empty, the original `Cause` is returned.
 *
 * @tsplus static fncts.data.CauseOps traced
 * @tsplus static fncts.data.Cause.TracedOps __call
 */
export function traced<E>(cause: Cause<E>, trace: Trace): Cause<E> {
  return cause.mapTrace((t) => t.combine(trace));
}

/**
 * Constructs a `Cause` from a single `unknown`, representing an untyped failure
 *
 * @tsplus static fncts.data.CauseOps halt
 * @tsplus static fncts.data.Cause.HaltOps __call
 */
export function halt(value: unknown, trace: Trace = Trace.none): Cause<never> {
  return new Halt(value, trace);
}

/**
 * Constructs a `Cause` from an `Id`, representing an interruption of asynchronous computation
 *
 * @tsplus static fncts.data.CauseOps interrupt
 * @tsplus static fncts.data.Cause.InterruptOps __call
 */
export function interrupt(id: FiberId, trace: Trace = Trace.none): Cause<never> {
  return new Interrupt(id, trace);
}

/**
 * Constructs a `Cause` from two `Cause`s, representing sequential failures.
 *
 * @note If one of the `Cause`s is `Empty`, the non-empty `Cause` is returned
 *
 * @tsplus static fncts.data.CauseOps then
 * @tsplus static fncts.data.Cause.ThenOps __call
 */
export function then<E, E1>(left: Cause<E>, right: Cause<E1>): Cause<E | E1> {
  return left.isEmpty ? right : right.isEmpty ? left : new Then<E | E1>(left, right);
}

/**
 * Constructs a `Cause` from two `Cause`s, representing parallel failures.
 *
 * @note If one of the `Cause`s is `Empty`, the non-empty `Cause` is returned
 *
 * @tsplus static fncts.data.CauseOps both
 * @tsplus static fncts.data.Cause.BothOps __call
 */
export function both<E, E1>(left: Cause<E>, right: Cause<E1>): Cause<E | E1> {
  return left.isEmpty ? right : right.isEmpty ? left : new Both<E | E1>(left, right);
}
