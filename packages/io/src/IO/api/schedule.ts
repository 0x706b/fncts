/**
 * @tsplus fluent fncts.io.IO schedule
 */
export function schedule_<R, E, A, R1, B>(
  self: IO<R, E, A>,
  schedule: Lazy<Schedule<R1, any, B>>,
  __tsplusTrace?: string,
): IO<R & R1 & Has<Clock>, E, B> {
  return Clock.schedule(self, schedule);
}
