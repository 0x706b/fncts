/**
 * Splits at the first element that satisfies `p`.
 *
 * @tsplus pipeable fncts.ReadonlyArray splitWhere
 */
export function splitWhere<A>(p: Predicate<A>) {
  return (self: ReadonlyArray<A>): readonly [ReadonlyArray<A>, ReadonlyArray<A>] => {
    let cont = true;
    let i    = 0;
    while (cont && i < self.length) {
      if (p(self[i]!)) {
        cont = false;
      } else {
        i++;
      }
    }
    return self.splitAt(i);
  };
}
