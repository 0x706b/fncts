/**
 * @tsplus pipeable fncts.ImmutableArray splitAt
 */
export function splitAt(n: number) {
  return <A>(as: ImmutableArray<A>): readonly [ImmutableArray<A>, ImmutableArray<A>] => {
    return [as.slice(0, n), as.slice(n)];
  };
}
