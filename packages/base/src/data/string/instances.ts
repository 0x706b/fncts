import * as P from "../../prelude";

/**
 * @tsplus static fncts.data.stringOps Eq
 */
export const Eq: P.Eq<string> = P.Eq({ equals_: (x, y) => x === y });

/**
 * @tsplus static fncts.data.stringOps Semigroup
 */
export const Semigroup: P.Semigroup<string> = P.Semigroup({ combine_: (x, y) => x + y });

/**
 * @tsplus static fncts.data.stringOps Monoid
 */
export const Monoid: P.Monoid<string> = P.Monoid({ combine_: (x, y) => x + y, nat: "" });

/**
 * @tsplus static fncts.data.stringOps Ord
 */
export const Ord: P.Ord<string> = P.Ord({
  compare_: (x, y) => (x < y ? -1 : x > y ? 1 : 0),
  equals_: (x, y) => x === y,
});
