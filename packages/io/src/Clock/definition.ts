/**
 * @tsplus type fncts.io.Clock
 * @tsplus companion fncts.io.ClockOps
 */
export abstract class Clock {
  abstract readonly currentTime: UIO<number>;
  abstract sleep(duration: Lazy<number>, __tsplusTrace?: string): UIO<void>;
}

/**
 * @tsplus static fncts.io.ClockOps Tag
 */
export const ClockTag = Tag<Clock>();
