/**
 * @tsplus getter fncts.data.Predicate invert
 */
export function invert<A>(self: Predicate<A>): Predicate<A> {
  return (a) => !self(a);
}
