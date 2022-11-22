import type { RuntimeFlags } from "@fncts/io/RuntimeFlags";

import { FiberRuntime } from "@fncts/io/Fiber/FiberRuntime";

/**
 * Returns an IO that forks this IO into its own separate fiber,
 * returning the fiber immediately, without waiting for it to begin executing
 * the IO.
 *
 * You can use the `fork` method whenever you want to execute an IO in a
 * new fiber, concurrently and without "blocking" the fiber executing other
 * IOs. Using fibers can be tricky, so instead of using this method
 * directly, consider other higher-level methods, such as `raceWith`,
 * `zipPar`, and so forth.
 *
 * The fiber returned by this method has methods interrupt the fiber and to
 * wait for it to finish executing the IO. See `Fiber` for more
 * information.
 *
 * Whenever you use this method to launch a new fiber, the new fiber is
 * attached to the parent fiber's scope. This means when the parent fiber
 * terminates, the child fiber will be terminated as well, ensuring that no
 * fibers leak. This behavior is called "None supervision", and if this
 * behavior is not desired, you may use the `forkDaemon` or `forkIn`
 * methods.
 *
 * @tsplus getter fncts.io.IO fork
 */
export function fork<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): URIO<R, FiberRuntime<E, A>> {
  return IO.withFiberRuntime((fiberState, status) =>
    IO.succeedNow(unsafeFork(ma, fiberState, status.runtimeFlags, null, __tsplusTrace)),
  );
}

/**
 * @tsplus pipeable fncts.io.IO forkWithScopeOverride
 */
export function forkWithScopeOverride(scopeOverride: FiberScope | null, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): URIO<R, FiberRuntime<E, A>> => {
    return IO.withFiberRuntime((parentFiber, parentStatus) =>
      IO.succeedNow(unsafeFork(self, parentFiber, parentStatus.runtimeFlags, scopeOverride, __tsplusTrace)),
    );
  };
}

export function unsafeFork<R, E, A, E1, B>(
  effect: IO<R, E, A>,
  parentFiber: FiberRuntime<E1, B>,
  parentRuntimeFlags: RuntimeFlags,
  overrideScope: FiberScope | null,
  trace?: string,
): FiberRuntime<E, A> {
  const fiber = unsafeMakeChildFiber(effect, parentFiber, parentRuntimeFlags, overrideScope, trace);
  fiber.resume(effect);
  return fiber;
}

export function unsafeMakeChildFiber<R, E, A, E1, B>(
  effect: IO<R, E, A>,
  parentFiber: FiberRuntime<E1, B>,
  parentRuntimeFlags: RuntimeFlags,
  overrideScope: FiberScope | null,
  trace?: string,
): FiberRuntime<E, A> {
  const childId         = FiberId.unsafeMake(trace);
  const parentFiberRefs = parentFiber.getFiberRefs();
  const childFiberRefs  = parentFiberRefs.forkAs(childId);

  const childFiber = new FiberRuntime<E, A>(childId, childFiberRefs, parentRuntimeFlags);

  const childEnvironment = childFiberRefs.getOrDefault(FiberRef.currentEnvironment);

  const supervisor = childFiber.getSupervisor();
  if (supervisor !== Supervisor.none) {
    supervisor.unsafeOnStart(childEnvironment, effect as IO<any, any, any>, Just(parentFiber), childFiber);
    childFiber.addObserver((exit) => supervisor.unsafeOnEnd(exit, childFiber));
  }

  const parentScope = overrideScope ?? parentFiber.getFiberRef(FiberRef.forkScopeOverride).getOrElse(parentFiber.scope);
  parentScope.unsafeAdd(parentFiber, parentRuntimeFlags, childFiber);

  return childFiber;
}
