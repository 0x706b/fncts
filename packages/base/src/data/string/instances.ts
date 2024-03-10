import { isString } from "@fncts/base/util/predicates";

import * as P from "../../typeclass.js";

/**
 * @tsplus static fncts.StringOps Eq
 * @tsplus implicit
 */
export const Eq: P.Eq<string> = P.Eq({ equals: (y) => (x) => x === y });

/**
 * @tsplus static fncts.StringOps Semigroup
 * @tsplus implicit
 */
export const Semigroup: P.Semigroup<string> = P.Semigroup({ combine: (y) => (x) => x + y });

/**
 * @tsplus static fncts.StringOps Monoid
 * @tsplus implicit
 */
export const Monoid: P.Monoid<string> = P.Monoid({ combine: (y) => (x) => x + y, nat: "" });

/**
 * @tsplus static fncts.StringOps Ord
 * @tsplus implicit
 */
export const Ord: P.Ord<string> = P.Ord({
  ...Eq,
  compare: (y) => (x) => (x < y ? -1 : x > y ? 1 : 0),
});

/**
 * @tsplus static fncts.StringOps Guard
 * @tsplus implicit
 */
export const Guard: P.Guard<string> = P.Guard(isString);
