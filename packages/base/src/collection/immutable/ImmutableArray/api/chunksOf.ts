/**
 * @tsplus fluent fncts.ImmutableArray chunksOf
 */
export function chunksOf_<A>(self: ImmutableArray<A>, n: number): ImmutableArray<ImmutableArray<A>> {
  return self.chop((as) => as.splitAt(n));
}
