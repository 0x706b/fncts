import {Conc, Empty} from "../definition";

/**
 * @tsplus static fncts.collection.immutable.ConcOps empty
 */
export function empty<B>(): Conc<B> {
  return new Empty();
}
