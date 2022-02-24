import type { UIO } from "../../IO";
import type { Fiber } from "../definition";

import { matchTag_ } from "../../../util/pattern";
import { IO } from "../../IO";

/**
 * @tsplus fluent fncts.control.Fiber evalOn
 */
export function evalOn_<E, A>(fiber: Fiber<E, A>, effect: UIO<any>, orElse: UIO<any>): UIO<void> {
  return matchTag_(fiber, {
    RuntimeFiber: (f) => f.evalOn(effect, orElse),
    SyntheticFiber: () => IO.unit,
  });
}
