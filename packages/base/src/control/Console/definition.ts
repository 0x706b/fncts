import type { UIO } from "../IO.js";

import { Tag } from "../../data/Tag.js";

/**
 * @tsplus type fncts.control.Console
 * @tsplus companion fncts.control.ConsoleOps
 */
export abstract class Console {
  abstract print(...data: unknown[]): UIO<void>;
  abstract error(...data: unknown[]): UIO<void>;
  abstract debug(...data: unknown[]): UIO<void>;
}

export const ConsoleKey = Symbol.for("fncts.base.control.Console.ServiceKey");

/**
 * @tsplus static fncts.control.ConsoleOps Tag
 */
export const ConsoleTag = Tag<Console>(ConsoleKey);
