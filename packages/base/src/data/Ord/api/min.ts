/**
 * @tsplus static fncts.OrdOps min
 * @tsplus getter fncts.Ord min
 */
export function min<A>(O: Ord<A>): (y: A) => (x: A) => A {
  return (y) => (x) => (x === y || O.compare(y)(x) < 1 ? x : y);
}
