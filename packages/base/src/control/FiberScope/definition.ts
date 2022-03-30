import type { FiberContext } from "../Fiber/FiberContext.js";

import { FiberId } from "../../data/FiberId.js";

/**
 * A `Scope` represents the scope of a fiber lifetime. The scope of a fiber can
 * be retrieved using IO.descriptor, and when forking fibers, you can
 * specify a custom scope to fork them on by using the IO#forkIn.
 *
 * @tsplus type fncts.control.FiberScope
 * @tsplus companion fncts.control.FiberScopeOps
 */
export abstract class FiberScope {
  abstract fiberId: FiberId;
  abstract unsafeAdd(child: FiberContext<unknown, unknown>): boolean;
}

export class Global extends FiberScope {
  get fiberId(): FiberId {
    return FiberId.none;
  }
  unsafeAdd(_child: FiberContext<any, any>): boolean {
    return true;
  }
}

export class Local extends FiberScope {
  constructor(
    readonly fiberId: FiberId,
    private parentRef: WeakRef<FiberContext<unknown, unknown>>,
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
