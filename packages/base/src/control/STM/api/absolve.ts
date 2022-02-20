import type { Either } from "../../../data/Either";

import { STM } from "../definition";

/**
 * Submerges the error case of an `Either` into the `STM`. The inverse
 * operation of `STM.either`.
 *
 * @tsplus getter fncts.control.STM absolve
 */
export function absolve<R, E, E1, A>(
  z: STM<R, E, Either<E1, A>>
): STM<R, E | E1, A> {
  return z.chain(STM.fromEitherNow);
}
