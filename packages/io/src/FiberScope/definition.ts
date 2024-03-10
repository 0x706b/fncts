import type { FiberRuntime } from "@fncts/io/Fiber/FiberRuntime";
import type { RuntimeFlags } from "@fncts/io/RuntimeFlags";

import { FiberMessage } from "@fncts/io/Fiber";

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
  abstract unsafeAdd(
    currentFiber: FiberRuntime<any, any>,
    runtimeFlags: RuntimeFlags,
    child: FiberRuntime<any, any>,
  ): void;
}

export class Global extends FiberScope {
  get fiberId(): FiberId {
    return FiberId.none;
  }
  unsafeAdd(_currentFiber: FiberRuntime<any, any>, runtimeFlags: RuntimeFlags, child: FiberRuntime<any, any>): void {
    if (runtimeFlags.fiberRoots) {
      Fiber._roots.add(child);
    }
  }
}

export class Local extends FiberScope {
  constructor(
    readonly fiberId: FiberId,
    private parentRef: WeakRef<FiberRuntime<unknown, unknown>>,
  ) {
    super();
  }
  unsafeAdd(currentFiber: FiberRuntime<any, any>, _runtimeFlags: RuntimeFlags, child: FiberRuntime<any, any>): void {
    const parent = this.parentRef.deref();
    if (parent != null) {
      if (currentFiber === parent) {
        parent.addChild(child);
      } else {
        parent.tell(FiberMessage.Stateful((parentFiber) => parentFiber.addChild(child)));
      }
    } else {
      child.tell(FiberMessage.InterruptSignal(Cause.interrupt(currentFiber.id)));
    }
  }
}
