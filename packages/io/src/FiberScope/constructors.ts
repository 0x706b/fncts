import type { FiberRuntime } from "@fncts/io/Fiber/FiberRuntime";

import { Global, Local } from "@fncts/io/FiberScope/definition";

/**
 * The global scope. Anything forked onto the global scope is not supervised,
 * and will only terminate on its own accord (never from interruption of a
 * parent fiber, because there is no parent fiber).
 *
 * @tsplus static fncts.io.FiberScopeOps global
 */
export const global = new Global();

/**
 * @tsplus static fncts.io.FiberScopeOps unsafeMake
 */
export function unsafeMake(fiber: FiberRuntime<any, any>): FiberScope {
  return new Local(fiber.id, new WeakRef(fiber));
}
