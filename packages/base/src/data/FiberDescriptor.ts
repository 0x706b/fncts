import type { Scope } from "../control/Scope";
import type { FiberId } from "./FiberId";
import type { FiberStatus } from "./FiberStatus";
import type { InterruptStatus } from "./InterruptStatus";

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
