import type { IsInt } from "@fncts/base/types";

/**
 * @tsplus getter fncts.Number milliseconds
 * @tsplus static fncts.DurationOps milliseconds
 */
export function milliseconds(self: number): Duration {
  return new Duration(Math.round(self));
}

/**
 * @tsplus getter fncts.Number seconds
 * @tsplus static fncts.DurationOps seconds
 */
export function seconds(self: number): Duration {
  return new Duration(Math.round(self * 1000));
}

/**
 * @tsplus getter fncts.Number minutes
 * @tsplus static fncts.DurationOps minutes
 */
export function minutes(self: number): Duration {
  return new Duration(Math.round(self * 60_000));
}

/**
 * @tsplus getter fncts.Number hours
 * @tsplus static fncts.DurationOps hours
 */
export function hours(self: number): Duration {
  return new Duration(Math.round(self * 3_600_000));
}

/**
 * @tsplus getter fncts.Number days
 * @tsplus static fncts.DurationOps days
 */
export function days(self: number): Duration {
  return new Duration(Math.round(self * 86_400_000));
}

/**
 * @tsplus operator fncts.Duration *
 */
export function mult(self: Duration, multiplicand: number) {
  return new Duration(self.milliseconds * Math.round(multiplicand));
}

/**
 * @tsplus operator fncts.Duration *
 */
export function multInverted(multiplicand: number, self: Duration) {
  return new Duration(Math.round(self.milliseconds) * multiplicand);
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

/**
 * @tsplus static fncts.DurationOps fromInterval
 */
export function fromInterval(start: number, end: number): Duration {
  return Duration.milliseconds(Math.round(end) - Math.round(start));
}