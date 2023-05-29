import { Console } from "@fncts/io/Console/definition";

export class LiveConsole extends Console {
  show(...data: unknown[]) {
    return IO(console.log(...data));
  }
  print(line: string) {
    return IO(console.log(line));
  }
  error(line: string) {
    return IO(console.error(line));
  }
}

/**
 * @tsplus static fncts.io.ConsoleOps Live
 */
export const live: Console = new LiveConsole();
