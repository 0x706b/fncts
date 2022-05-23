import * as P from "@fncts/base/typeclass";
import { isBigInt } from "@fncts/base/util/predicates";

/**
 * @tsplus static fncts.BigIntOps Guard
 * @tsplus implicit
 */
export const Guard: P.Guard<bigint> = P.Guard(isBigInt);
