import type { Fiber } from "../definition.js";

import { Nothing } from "../../../data/Maybe.js";
import { IO } from "../../IO.js";

/**
 * A fiber that never fails or succeeds
 *
 * @tsplus static fncts.control.FiberOps never
 */
export const never: Fiber<never, never> = {
  _tag: "SyntheticFiber",
  await: IO.never,
  getRef: (fiberRef) => IO.succeedNow(fiberRef.initial),
  interruptAs: () => IO.never,
  inheritRefs: IO.unit,
  poll: IO.succeedNow(Nothing()),
};
