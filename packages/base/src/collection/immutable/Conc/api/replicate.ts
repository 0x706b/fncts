import { Conc } from "../definition";

/**
 * @tsplus static fncts.collection.immutable.ConcOps replicate
 */
export function replicate<A>(n: number, a: A): Conc<A> {
  return Conc.makeBy(n, () => a);
}
