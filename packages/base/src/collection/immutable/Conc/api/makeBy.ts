import { Conc } from "../definition";

/**
 * Fills a Conc with the result of applying `f` `n` times
 *
 * @tsplus static fncts.collection.immutable.ConcOps makeBy
 */
export function makeBy<A>(n: number, f: (n: number) => A): Conc<A> {
  if (n <= 0) {
    return Conc.empty<A>();
  }
  let r = Conc.empty<A>();

  for (let i = 0; i < n; i++) {
    r = r.append(f(i));
  }
  return r;
}
