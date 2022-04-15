import * as P from "../../typeclass.js";
import { EQ, GT, LT } from "../../typeclass.js";

/**
 * @tsplus static fncts.NumberOps Eq
 */
export const Eq: P.Eq<number> = P.Eq({ equals_: (x, y) => x === y });

/**
 * @tsplus static fncts.NumberOps Ord
 */
export const Ord: P.Ord<number> = P.Ord({
  compare_: (x, y) => (x < y ? LT : x > y ? GT : EQ),
  equals_: (x, y) => x === y,
});
