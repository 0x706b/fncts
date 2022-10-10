import type { Ord } from "@fncts/base/typeclass/Ord/definition";
/**
 * @tsplus static fncts.OrdOps max
 * @tsplus getter fncts.Ord max
 */
export function max_<A>(O: Ord<A>): (x: A, y: A) => A {
  return (x, y) => (x === y || O.compare(x, y) > -1 ? x : y);
}
