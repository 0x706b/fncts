import { isNumber } from "@fncts/base/util/predicates";

import * as P from "../../typeclass.js";
import { EQ, GT, LT } from "../../typeclass.js";

/**
 * @tsplus static fncts.NumberOps Eq
 * @tsplus implicit
 */
export const Eq: P.Eq<number> = P.Eq({ equals: (x, y) => x === y });

/**
 * @tsplus static fncts.NumberOps Ord
 * @tsplus implicit
 */
export const Ord: P.Ord<number> = P.Ord({
  compare: (x, y) => (x < y ? LT : x > y ? GT : EQ),
  equals: (x, y) => x === y,
});

/**
 * @tsplus static fncts.NumberOps Guard
 * @tsplus implicit
 */
export const Guard: P.Guard<number> = P.Guard(isNumber);