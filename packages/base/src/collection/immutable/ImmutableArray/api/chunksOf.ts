/**
 * @tsplus pipeable fncts.ImmutableArray chunksOf
 */
export function chunksOf(n: number) {
  return <A>(self: ImmutableArray<A>): ImmutableArray<ImmutableArray<A>> => {
    return self.chop((as) => as.splitAt(n));
  };
}
