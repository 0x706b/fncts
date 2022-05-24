/**
 * @tsplus fluent fncts.ImmutableArray slice
 */
export function slice_<A>(self: ImmutableArray<A>, start?: number, end?: number): ImmutableArray<A> {
  return self._array.slice(start, end).asImmutableArray;
}
