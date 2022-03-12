import type { Scope } from "../control/Scope.js";
import type { FiberId } from "./FiberId.js";
import type { FiberStatus } from "./FiberStatus.js";
import type { InterruptStatus } from "./InterruptStatus.js";

/**
 * A record containing information about a `Fiber`.
 *
 * @tsplus type fncts.control.FiberDescriptor
 * @tsplus companion fncts.control.FiberDescriptorOps
 */
export class FiberDescriptor {
  constructor(
    readonly id: FiberId,
    readonly status: FiberStatus,
    readonly interruptors: ReadonlySet<FiberId>,
    readonly interruptStatus: InterruptStatus,
    readonly scope: Scope,
  ) {}
}
