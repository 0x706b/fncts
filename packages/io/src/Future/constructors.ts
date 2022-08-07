import { Future, Pending } from "@fncts/io/Future/definition";

/**
 * Makes a new future to be completed by the fiber creating the future.
 *
 * @tsplus static fncts.io.FutureOps make
 */
export function make<E, A>(__tsplusTrace?: string): IO<never, never, Future<E, A>> {
  return IO.fiberId.flatMap((id) => Future.makeAs<E, A>(id));
}

/**
 * Makes a new future to be completed by the fiber with the specified id.
 *
 * @tsplus static fncts.io.FutureOps makeAs
 */
export function makeAs<E, A>(fiberId: FiberId, __tsplusTrace?: string) {
  return IO.succeed(unsafeMake<E, A>(fiberId));
}

/**
 * Makes a new future to be completed by the fiber with the specified id.
 *
 * @tsplus static fncts.io.FutureOps unsafeMake
 */
export function unsafeMake<E, A>(fiberId: FiberId) {
  return new Future<E, A>(new Pending(List.empty()), fiberId);
}
