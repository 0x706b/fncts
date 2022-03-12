import type { UIO } from "../IO.js";

import { Either } from "../../data/Either.js";
import { IO } from "../IO.js";
import { Clock } from "./definition.js";

class LiveClock extends Clock {
  currentTime: UIO<number> = IO.succeed(Date.now());

  sleep(duration: number, __tsplusTrace?: string): UIO<void> {
    return IO.asyncInterrupt<unknown, never, void>((k) => {
      const handle = setTimeout(() => {
        k(IO.unit);
      }, duration);
      return Either.left(
        IO.succeed(() => {
          clearTimeout(handle);
        }),
      );
    });
  }
}

/**
 * @tsplus static fncts.control.ClockOps Live
 */
export const live: Clock = new LiveClock();
