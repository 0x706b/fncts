import { Monoid } from "@fncts/base/typeclass/Monoid";
import { Semigroup } from "@fncts/base/typeclass/Semigroup";

/**
 * @tsplus static fncts.OrdOps getSemigroup
 */
export function getSemigroup<A = never>(): Semigroup<Ord<A>> {
  return Semigroup({
    combine: (y) => (x) =>
      Ord({
        compare: (a2) => (a1) => {
          const ox = x.compare(a2)(a1);
          return ox !== 0 ? ox : y.compare(a2)(a1);
        },
        equals: (a2) => (a1) => x.equals(a2)(a1) && y.equals(a2)(a1),
      }),
  });
}

/**
 * @tsplus static fncts.OrdOps getMonoid
 */
export function getMonoid<A = never>(): Monoid<Ord<A>> {
  return Monoid({
    ...Ord.getSemigroup<A>(),
    nat: Ord({ compare: () => () => Ordering.EQ, equals: () => () => true }),
  });
}
