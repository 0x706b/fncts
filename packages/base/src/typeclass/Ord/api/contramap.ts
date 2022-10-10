import type { Ord } from "@fncts/base/typeclass/Ord/definition";
/**
 * @tsplus pipeable fncts.Ord contramap
 */
export function contramap<A, B>(f: (b: B) => A) {
  return (self: Ord<A>): Ord<B> => {
    return {
      compare: (x, y) => self.compare(f(x), f(y)),
      equals: (x, y) => self.equals(f(x), f(y)),
    };
  };
}
