import type { IsInt } from "../../types/Number.js";

import { Duration } from "./definition.js";

/**
 * @tsplus getter fncts.data.Number milliseconds
 * @tsplus static fncts.data.DurationOps milliseconds
 */
export function milliseconds<N extends number>(self: IsInt<N>): Duration {
  return new Duration(self);
}

/**
 * @tsplus getter fncts.data.Number seconds
 * @tsplus static fncts.data.DurationOps seconds
 */
export function seconds<N extends number>(self: IsInt<N>): Duration {
  return new Duration(self * 1000);
}

/**
 * @tsplus getter fncts.data.Number minutes
 * @tsplus static fncts.data.DurationOps minutes
 */
export function minutes<N extends number>(self: IsInt<N>): Duration {
  return new Duration(self * 60_000);
}

/**
 * @tsplus getter fncts.data.Number hours
 * @tsplus static fncts.data.DurationOps hours
 */
export function hours<N extends number>(self: IsInt<N>): Duration {
  return new Duration(self * 3_600_000);
}

/**
 * @tsplus getter fncts.data.Number days
 * @tsplus static fncts.data.DurationOps days
 */
export function days<N extends number>(self: IsInt<N>): Duration {
  return new Duration(self * 86_400_000);
}

/**
 * @tsplus operator fncts.data.Duration *
 */
export function mult<N extends number>(self: Duration, multiplicand: IsInt<N>) {
  return new Duration(self.milliseconds * multiplicand);
}

/**
 * @tsplus operator fncts.data.Duration *
 */
export function multInverted<N extends number>(multiplicand: IsInt<N>, self: Duration) {
  return new Duration(self.milliseconds * multiplicand);
}

/**
 * @tsplus operator fncts.data.Duration +
 */
export function sum(self: Duration, that: Duration): Duration {
  return new Duration(self.milliseconds + that.milliseconds);
}

/**
 * @tsplus operator fncts.data.Duration -
 */
export function difference(self: Duration, that: Duration): Duration {
  return new Duration(self.milliseconds - that.milliseconds);
}
