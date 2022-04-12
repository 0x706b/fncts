/**
 * @tsplus type fncts.control.Console
 * @tsplus companion fncts.control.ConsoleOps
 */
export abstract class Console {
  abstract show(...data: unknown[]): UIO<void>;
  abstract print(line: string): UIO<void>;
  abstract error(line: string): UIO<void>;
}

/**
 * @tsplus static fncts.control.ConsoleOps Tag
 */
export const ConsoleTag = Tag<Console>();
