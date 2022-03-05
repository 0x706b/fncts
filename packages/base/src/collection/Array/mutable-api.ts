/**
 * @tsplus getter fncts.collection.mutable.Array unsafeAsImmutable
 * @tsplus macro identity
 */
export function unsafeAsImmutable<A>(self: Array<A>): ReadonlyArray<A> {
  return self;
}
