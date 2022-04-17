import type { Ord } from "@fncts/base/typeclass/Ord/definition";

/**
 * @tsplus fluent fncts.Ord contramap
 */
export function contramap<A, B>(self: Ord<A>, f: (b: B) => A): Ord<B> {
  return {
    compare_: (x, y) => self.compare_(f(x), f(y)),
    compare: (y) => (x) => self.compare_(f(x), f(y)),
    equals_: (x, y) => self.equals_(f(x), f(y)),
    equals: (y) => (x) => self.equals_(f(x), f(y)),
  };
}
