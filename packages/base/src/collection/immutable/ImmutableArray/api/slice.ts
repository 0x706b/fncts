/**
 * @tsplus pipeable fncts.ImmutableArray slice
 */
export function slice(start?: number, end?: number) {
  return <A>(self: ImmutableArray<A>): ImmutableArray<A> => {
    return self._array.slice(start, end).asImmutableArray;
  };
}
