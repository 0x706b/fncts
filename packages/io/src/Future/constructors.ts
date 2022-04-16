import { Pending } from "@fncts/io/Future/definition";

/**
 * Makes a new future to be completed by the fiber creating the future.
 *
 * @tsplus static fncts.control.FutureOps make
 */
export function make<E, A>(): IO<unknown, never, Future<E, A>> {
  return IO.fiberId.flatMap((id) => Future.makeAs<E, A>(id));
}

/**
 * Makes a new future to be completed by the fiber with the specified id.
 *
 * @tsplus static fncts.control.FutureOps makeAs
 */
export function makeAs<E, A>(fiberId: FiberId) {
  return IO.succeed(unsafeMake<E, A>(fiberId));
}

/**
 * Makes a new future to be completed by the fiber with the specified id.
 *
 * @tsplus static fncts.control.FutureOps unsafeMake
 */
export function unsafeMake<E, A>(fiberId: FiberId) {
  return new Future<E, A>(new Pending(List.empty()), fiberId);
}
