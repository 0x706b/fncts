import * as P from "@fncts/base/typeclass";
import { isBoolean } from "@fncts/base/util/predicates";

/**
 * @tsplus static fncts.BooleanOps Guard
 * @tsplus implicit
 */
export const Guard: P.Guard<boolean> = P.Guard(isBoolean);
