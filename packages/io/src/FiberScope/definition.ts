import type { FiberRuntime } from "@fncts/io/Fiber/FiberRuntime";

/**
 * A `Scope` represents the scope of a fiber lifetime. The scope of a fiber can
 * be retrieved using IO.descriptor, and when forking fibers, you can
 * specify a custom scope to fork them on by using the IO#forkIn.
 *
 * @tsplus type fncts.io.FiberScope
 * @tsplus companion fncts.io.FiberScopeOps
 */
export abstract class FiberScope {
  abstract fiberId: FiberId;
  abstract unsafeAdd(child: FiberRuntime<unknown, unknown>): boolean;
}

export class Global extends FiberScope {
  get fiberId(): FiberId {
    return FiberId.none;
  }
  unsafeAdd(_child: FiberRuntime<any, any>): boolean {
    return true;
  }
}

export class Local extends FiberScope {
  constructor(readonly fiberId: FiberId, private parentRef: WeakRef<FiberRuntime<unknown, unknown>>) {
    super();
  }
  unsafeAdd(child: FiberRuntime<unknown, unknown>): boolean {
    const parent = this.parentRef.deref();
    if (parent != null) {
      parent.addChild(child);
      return true;
    } else {
      return false;
    }
  }
}
