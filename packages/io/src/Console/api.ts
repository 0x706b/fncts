import { Console } from "./definition.js";

/**
 * @tsplus static fncts.io.ConsoleOps show
 */
export function show(...data: unknown[]): URIO<Has<Console>, void> {
  return IO.serviceWithIO((console) => console.show(...data), Console.Tag);
}

/**
 * @tsplus static fncts.io.ConsoleOps print
 */
export function print(line: string): URIO<Has<Console>, void> {
  return IO.serviceWithIO((console) => console.print(line), Console.Tag);
}
