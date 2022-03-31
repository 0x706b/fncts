import type { Lazy } from "../../../data/function.js";
import type { Has } from "../../../prelude.js";
import type { Schedule } from "../../Schedule.js";
import type { IO } from "../definition.js";

import { Clock } from "../../Clock.js";

/**
 * @tsplus fluent fncts.control.IO schedule
 */
export function schedule_<R, E, A, R1, B>(
  self: IO<R, E, A>,
  schedule: Lazy<Schedule<R1, any, B>>,
  __tsplusTrace?: string,
): IO<R & R1 & Has<Clock>, E, B> {
  return Clock.schedule(self, schedule);
}
