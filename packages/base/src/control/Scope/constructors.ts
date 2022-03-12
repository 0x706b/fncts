import type { FiberContext } from "../Fiber/FiberContext.js";
import type { Scope } from "./definition.js";

import { Global, Local } from "./definition.js";

/**
 * The global scope. Anything forked onto the global scope is not supervised,
 * and will only terminate on its own accord (never from interruption of a
 * parent fiber, because there is no parent fiber).
 *
 * @tsplus static fncts.control.ScopeOps global
 */
export const global = new Global();

/**
 * @tsplus static fncts.control.ScopeOps unsafeMake
 */
export function unsafeMake(fiber: FiberContext<any, any>): Scope {
  return new Local(fiber.id, new WeakRef(fiber));
}
