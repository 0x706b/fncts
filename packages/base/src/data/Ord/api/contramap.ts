/**
 * @tsplus pipeable fncts.Ord contramap
 */
export function contramap<A, B>(f: (b: B) => A) {
  return (self: Ord<A>): Ord<B> => {
    return {
      compare: (y) => (x) => self.compare(f(y))(f(x)),
      equals: (y) => (x) => self.equals(f(y))(f(x)),
    };
  };
}
