/**
 * @tsplus fluent fncts.ImmutableArray splitAt
 */
export function splitAt_<A>(as: ImmutableArray<A>, n: number): readonly [ImmutableArray<A>, ImmutableArray<A>] {
  return [as.slice(0, n), as.slice(n)];
}
