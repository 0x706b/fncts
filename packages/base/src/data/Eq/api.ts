/**
 * @tsplus pipeable fncts.Eq contramap
 */
export function contramap<A, B>(f: (b: B) => A) {
  return (self: Eq<A>): Eq<B> => {
    return Eq({ equals: (b2) => (b1) => self.equals(f(b2))(f(b1)) });
  };
}
