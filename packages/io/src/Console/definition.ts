/**
 * @tsplus type fncts.io.Console
 * @tsplus companion fncts.io.ConsoleOps
 */
export abstract class Console {
  abstract show(...data: unknown[]): UIO<void>;
  abstract print(line: string): UIO<void>;
  abstract error(line: string): UIO<void>;
}

/**
 * @tsplus static fncts.io.ConsoleOps Tag
 */
export const ConsoleTag = Tag<Console>();
