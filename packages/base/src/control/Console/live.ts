import { Console } from "@fncts/base/control/Console/definition";

export class LiveConsole extends Console {
  print(...data: unknown[]) {
    return IO(console.log(...data));
  }
  error(...data: unknown[]) {
    return IO(console.error(...data));
  }
  debug(...data: unknown[]) {
    return IO(console.debug(...data));
  }
}

/**
 * @tsplus static fncts.control.ConsoleOps Live
 */
export const live: Console = new LiveConsole();
