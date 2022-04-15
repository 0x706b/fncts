import type { IsInt } from "@fncts/base/types";

/**
 * @tsplus getter fncts.Number milliseconds
 * @tsplus static fncts.DurationOps milliseconds
 */
export function milliseconds<N extends number>(self: IsInt<N>): Duration {
  return new Duration(self);
}

/**
 * @tsplus getter fncts.Number seconds
 * @tsplus static fncts.DurationOps seconds
 */
export function seconds<N extends number>(self: IsInt<N>): Duration {
  return new Duration(self * 1000);
}

/**
 * @tsplus getter fncts.Number minutes
 * @tsplus static fncts.DurationOps minutes
 */
export function minutes<N extends number>(self: IsInt<N>): Duration {
  return new Duration(self * 60_000);
}

/**
 * @tsplus getter fncts.Number hours
 * @tsplus static fncts.DurationOps hours
 */
export function hours<N extends number>(self: IsInt<N>): Duration {
  return new Duration(self * 3_600_000);
}

/**
 * @tsplus getter fncts.Number days
 * @tsplus static fncts.DurationOps days
 */
export function days<N extends number>(self: IsInt<N>): Duration {
  return new Duration(self * 86_400_000);
}

/**
 * @tsplus operator fncts.Duration *
 */
export function mult<N extends number>(self: Duration, multiplicand: IsInt<N>) {
  return new Duration(self.milliseconds * multiplicand);
}

/**
 * @tsplus operator fncts.Duration *
 */
export function multInverted<N extends number>(multiplicand: IsInt<N>, self: Duration) {
  return new Duration(self.milliseconds * multiplicand);
}

/**
 * @tsplus operator fncts.Duration +
 */
export function sum(self: Duration, that: Duration): Duration {
  return new Duration(self.milliseconds + that.milliseconds);
}

/**
 * @tsplus operator fncts.Duration -
 */
export function difference(self: Duration, that: Duration): Duration {
  return new Duration(self.milliseconds - that.milliseconds);
}
