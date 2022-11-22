import type { FiberId } from "@fncts/base/data/FiberId";
import type { FiberStatus } from "@fncts/io/FiberStatus";

/**
 * A record containing information about a `Fiber`.
 *
 * @tsplus type fncts.io.FiberDescriptor
 * @tsplus companion fncts.io.FiberDescriptorOps
 */
export class FiberDescriptor {
  constructor(readonly id: FiberId, readonly status: FiberStatus, readonly interruptors: HashSet<FiberId>) {}
}
