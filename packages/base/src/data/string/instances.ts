import * as P from "../../typeclass.js";

/**
 * @tsplus static fncts.StringOps Eq
 */
export const Eq: P.Eq<string> = P.Eq({ equals_: (x, y) => x === y });

/**
 * @tsplus static fncts.StringOps Semigroup
 */
export const Semigroup: P.Semigroup<string> = P.Semigroup({ combine_: (x, y) => x + y });

/**
 * @tsplus static fncts.StringOps Monoid
 */
export const Monoid: P.Monoid<string> = P.Monoid({ combine_: (x, y) => x + y, nat: "" });

/**
 * @tsplus static fncts.StringOps Ord
 */
export const Ord: P.Ord<string> = P.Ord({
  compare_: (x, y) => (x < y ? -1 : x > y ? 1 : 0),
  equals_: (x, y) => x === y,
});
