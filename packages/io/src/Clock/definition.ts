/**
 * @tsplus type fncts.io.Clock
 * @tsplus companion fncts.io.ClockOps
 */
export abstract class Clock {
  abstract readonly currentTime: UIO<number>;
  abstract sleep(duration: Lazy<Duration>, __tsplusTrace?: string): UIO<void>;
}

/**
 * @tsplus static fncts.io.ClockOps Tag
 * @tsplus implicit
 */
export const ClockTag = Tag<Clock>("fncts.io.Clock");
