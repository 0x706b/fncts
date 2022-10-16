import { EQ, GT, LT } from "@fncts/base/data/Ordering";
import { isNumber } from "@fncts/base/util/predicates";

import * as P from "../../typeclass.js";

/**
 * @tsplus static fncts.NumberOps Eq
 * @tsplus implicit
 */
export const Eq: P.Eq<number> = P.Eq({ equals: (y) => (x) => x === y });

/**
 * @tsplus static fncts.NumberOps Ord
 * @tsplus implicit
 */
export const Ord: P.Ord<number> = P.Ord({
  compare: (y) => (x) => x < y ? LT : x > y ? GT : EQ,
  equals: (y) => (x) => x === y,
});

/**
 * @tsplus static fncts.NumberOps Guard
 * @tsplus static fncts.GuardOps number
 */
export const Guard: P.Guard<number> = P.Guard(isNumber);
