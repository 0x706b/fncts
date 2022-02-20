import type { Either } from "../../../data/Either";
import type { Lazy } from "../../../data/function";

import { STM } from "../definition";

/**
 * Lifts an `Either` into a `STM`.
 *
 * @tsplus static fncts.control.STMOps fromEither
 */
export function fromEither<E, A>(e: Lazy<Either<E, A>>): STM<unknown, E, A> {
  return STM.defer(e().match(STM.failNow, STM.succeedNow));
}

/**
 * Lifts an `Either` into a `STM`.
 *
 * @tsplus static fncts.control.STMOps fromEitherNow
 */
export function fromEitherNow<E, A>(e: Either<E, A>): STM<unknown, E, A> {
  return e.match(STM.failNow, STM.succeedNow);
}
