import type { UIO } from "../../IO.js";
import type { Fiber } from "../definition.js";

import { matchTag_ } from "../../../util/pattern.js";
import { IO } from "../../IO.js";

/**
 * @tsplus fluent fncts.control.Fiber evalOn
 */
export function evalOn_<E, A>(fiber: Fiber<E, A>, effect: UIO<any>, orElse: UIO<any>): UIO<void> {
  return matchTag_(fiber, {
    RuntimeFiber: (f) => f.evalOn(effect, orElse),
    SyntheticFiber: () => IO.unit,
  });
}
