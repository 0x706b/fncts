/**
 * @tsplus static fncts.OrdOps max
 * @tsplus getter fncts.Ord max
 */
export function max<A>(O: Ord<A>): (y: A) => (x: A) => A {
  return (y) => (x) => x === y || O.compare(y)(x) > -1 ? x : y;
}
