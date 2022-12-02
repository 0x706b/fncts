import type { FiberRuntime } from "@fncts/io/Fiber/FiberRuntime";

/**
 * Forks the effect into a new fiber attached to the global scope. Because the
 * new fiber is attached to the global scope, when the fiber executing the
 * returned effect terminates, the forked fiber will continue running.
 *
 * @tsplus getter fncts.io.IO forkDaemon
 */
export function forkDaemon<R, E, A>(ma: IO<R, E, A>, __tsplusTrace?: string): URIO<R, FiberRuntime<E, A>> {
  return ma.fork.daemonChildren;
}
