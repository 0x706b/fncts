import type { FiberContext } from "../Fiber/FiberContext";

import { FiberId } from "../../data/FiberId";

/**
 * A `Scope` represents the scope of a fiber lifetime. The scope of a fiber can
 * be retrieved using IO.descriptor, and when forking fibers, you can
 * specify a custom scope to fork them on by using the IO#forkIn.
 *
 * @tsplus type fncts.control.Scope
 * @tsplus companion fncts.control.ScopeOps
 */
export abstract class Scope {
  abstract fiberId: FiberId;
  abstract unsafeAdd(child: FiberContext<unknown, unknown>): boolean;
}

export class Global extends Scope {
  get fiberId(): FiberId {
    return FiberId.none;
  }
  unsafeAdd(_child: FiberContext<unknown, unknown>): boolean {
    return true;
  }
}

export class Local extends Scope {
  constructor(
    readonly fiberId: FiberId,
    private parentRef: WeakRef<FiberContext<unknown, unknown>>
  ) {
    super();
  }
  unsafeAdd(child: FiberContext<unknown, unknown>): boolean {
    const parent = this.parentRef.deref();
    if (parent != null) {
      parent.unsafeAddChild(child);
      return true;
    } else {
      return false;
    }
  }
}
