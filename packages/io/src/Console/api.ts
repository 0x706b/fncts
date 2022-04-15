import { Console } from "./definition.js";

/**
 * @tsplus static fncts.control.ConsoleOps show
 */
export function show(...data: unknown[]): URIO<Has<Console>, void> {
  return IO.serviceWithIO((console) => console.show(...data), Console.Tag);
}

/**
 * @tsplus static fncts.control.ConsoleOps print
 */
export function print(line: string): URIO<Has<Console>, void> {
  return IO.serviceWithIO((console) => console.print(line), Console.Tag);
}
