import { Monoid } from "@fncts/base/typeclass/Monoid";
import { Ord } from "@fncts/base/typeclass/Ord/definition";
import { Ordering } from "@fncts/base/typeclass/Ordering";
import { Semigroup } from "@fncts/base/typeclass/Semigroup";

/**
 * @tsplus static fncts.OrdOps getSemigroup
 */
export function getSemigroup<A = never>(): Semigroup<Ord<A>> {
  return Semigroup({
    combine: (x, y) =>
      Ord({
        compare: (a1, a2) => {
          const ox = x.compare(a1, a2);
          return ox !== 0 ? ox : y.compare(a1, a2);
        },
        equals: (a1, a2) => x.equals(a1, a2) && y.equals(a1, a2),
      }),
  });
}

/**
 * @tsplus static fncts.OrdOps getMonoid
 */
export function getMonoid<A = never>(): Monoid<Ord<A>> {
  return Monoid({
    ...Ord.getSemigroup<A>(),
    nat: Ord({ compare: () => Ordering.EQ, equals: () => true }),
  });
}
