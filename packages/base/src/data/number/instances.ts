import * as P from "../../prelude";
import { EQ, GT, LT } from "../../prelude";

/**
 * @tsplus static fncts.data.numberOps Eq
 */
export const Eq: P.Eq<number> = P.Eq({ equals_: (x, y) => x === y });

/**
 * @tsplus static fncts.data.numberOps Ord
 */
export const Ord: P.Ord<number> = P.Ord({
  compare_: (x, y) => (x < y ? LT : x > y ? GT : EQ),
  equals_: (x, y) => x === y,
});
