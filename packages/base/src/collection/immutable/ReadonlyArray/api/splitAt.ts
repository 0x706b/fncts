/**
 * Splits an array at index `n`.
 *
 * @tsplus pipeable fncts.ReadonlyArray splitAt
 */
export function splitAt(n: number) {
  return <A>(as: ReadonlyArray<A>): readonly [ReadonlyArray<A>, ReadonlyArray<A>] => {
    return [as.slice(0, n), as.slice(n)];
  };
}
