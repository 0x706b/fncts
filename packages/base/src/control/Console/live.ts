import { Console } from "@fncts/base/control/Console/definition";

export class LiveConsole extends Console {
  show(...data: unknown[]) {
    return IO(console.log(...data));
  }
  print(line: string) {
    return IO(console.log(line));
  }
  error(line: string) {
    return IO(console.debug(line));
  }
}

/**
 * @tsplus static fncts.control.ConsoleOps Live
 */
export const live: Console = new LiveConsole();
