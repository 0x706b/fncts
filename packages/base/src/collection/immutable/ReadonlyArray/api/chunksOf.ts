/**
 * Splits an array into chunks of size `n`.
 *
 * @tsplus pipeable fncts.ReadonlyArray chunksOf
 */
export function chunksOf(n: number) {
  return <A>(self: ReadonlyArray<A>): ReadonlyArray<ReadonlyArray<A>> => {
    return self.chop((as) => as.splitAt(n));
  };
}
