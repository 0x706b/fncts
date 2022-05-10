import type { Ord } from "@fncts/base/typeclass/Ord/definition";

/**
 * @tsplus fluent fncts.Ord contramap
 */
export function contramap<A, B>(self: Ord<A>, f: (b: B) => A): Ord<B> {
  return {
    compare: (x, y) => self.compare(f(x), f(y)),
    equals: (x, y) => self.equals(f(x), f(y)),
  };
}
