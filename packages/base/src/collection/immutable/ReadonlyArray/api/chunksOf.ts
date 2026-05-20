/**
 * @tsplus pipeable fncts.ReadonlyArray chunksOf
 * @tsplus pipeable fncts.Array chunksOf
 */
export function chunksOf(n: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<ReadonlyArray<A>> => {
    return self.chop((as) => as.splitAt(n));
  };
}
