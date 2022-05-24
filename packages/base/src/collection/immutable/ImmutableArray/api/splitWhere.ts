/**
 * @tsplus fluent fncts.ImmutableArray splitWhere
 */
export function splitWhere_<A>(
  self: ImmutableArray<A>,
  p: Predicate<A>,
): readonly [ImmutableArray<A>, ImmutableArray<A>] {
  let cont = true;
  let i    = 0;
  while (cont && i < self.length) {
    if (p(self._array[i]!)) {
      cont = false;
    } else {
      i++;
    }
  }
  return self.splitAt(i);
}
