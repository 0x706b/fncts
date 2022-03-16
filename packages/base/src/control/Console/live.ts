import { IO } from "../IO.js";
import { Console } from "./definition.js";

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
