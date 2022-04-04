import { Monoid } from "@fncts/base/prelude/Monoid";
import { Ord } from "@fncts/base/prelude/Ord/definition";
import { Ordering } from "@fncts/base/prelude/Ordering";
import { Semigroup } from "@fncts/base/prelude/Semigroup";

/**
 * @tsplus static fncts.OrdOps getSemigroup
 */
export function getSemigroup<A = never>(): Semigroup<Ord<A>> {
  return Semigroup({
    combine_: (x, y) =>
      Ord({
        compare_: (a1, a2) => {
          const ox = x.compare_(a1, a2);
          return ox !== 0 ? ox : y.compare_(a1, a2);
        },
        equals_: (a1, a2) => x.equals_(a1, a2) && y.equals_(a1, a2),
      }),
  });
}

/**
 * @tsplus static fncts.OrdOps getMonoid
 */
export function getMonoid<A = never>(): Monoid<Ord<A>> {
  return Monoid({
    ...Ord.getSemigroup<A>(),
    nat: Ord({ compare_: () => Ordering.EQ, equals_: () => true }),
  });
}
