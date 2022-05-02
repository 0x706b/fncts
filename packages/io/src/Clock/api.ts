/**
 * @tsplus static fncts.io.ClockOps currentTime
 */
export const currentTime = IO.clockWith((clock) => clock.currentTime);

/**
 * @tsplus static fncts.io.ClockOps sleep
 */
export function sleep(duration: Lazy<Duration>, __tsplusTrace?: string): UIO<void> {
  return IO.clockWith((clock) => clock.sleep(duration));
}
