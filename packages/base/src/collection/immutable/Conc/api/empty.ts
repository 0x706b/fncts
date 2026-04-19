import { Empty } from "@fncts/base/collection/immutable/Conc/definition";

/**
 * Create an empty collection.
 *
 * @tsplus static fncts.ConcOps empty
 */
export function empty<B>(): Conc<B> {
  return new Empty();
}
