/**
 * @tsplus pipeable fncts.ImmutableArray splitWhere
 */
export function splitWhere<A>(p: Predicate<A>) {
  return (self: ImmutableArray<A>): readonly [ImmutableArray<A>, ImmutableArray<A>] => {
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
  };
}
