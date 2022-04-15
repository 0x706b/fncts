import type { FiberId } from "@fncts/base/data/FiberId";
import type { FiberScope } from "@fncts/io/FiberScope";
import type { FiberStatus } from "@fncts/io/FiberStatus";

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
    readonly scope: FiberScope,
  ) {}
}
