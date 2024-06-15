/**
 * @tsplus pipeable fncts.Eq contramap
 */
export function contramap<A, B>(f: (b: B) => A) {
  return (self: Eq<A>): Eq<B> => {
    return Eq({ equals: (b2) => (b1) => self.equals(f(b2))(f(b1)) });
  };
}

/**
 * @tsplus static fncts.EqOps all
 */
export function all<A>(collection: Iterable<Eq<A>>): Eq<ReadonlyArray<A>> {
  return Eq({
    equals: (y) => (x) => {
      const len = Math.min(x.length, y.length);

      let collectionLength = 0;
      for (const eq of collection) {
        if (collectionLength >= len) {
          break;
        }
        if (!eq.equals(y[collectionLength]!)(x[collectionLength]!)) {
          return false;
        }
        collectionLength++;
      }
      return true;
    },
  });
}
