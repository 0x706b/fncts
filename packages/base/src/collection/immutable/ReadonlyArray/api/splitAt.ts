/**
 * @tsplus pipeable fncts.ReadonlyArray splitAt
 * @tsplus pipeable fncts.Array splitAt
 */
export function splitAt(n: number) {
  return <A>(as: ReadonlyArray<A>): readonly [ReadonlyArray<A>, ReadonlyArray<A>] => {
    return [as.slice(0, n), as.slice(n)];
  };
}
