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
  return new Duration(Math.round(self * 60000));
}

/**
 * @tsplus getter fncts.Number hours
 * @tsplus static fncts.DurationOps hours
 */
export function hours(self: number): Duration {
  return new Duration(Math.round(self * 3600000));
}

/**
 * @tsplus getter fncts.Number days
 * @tsplus static fncts.DurationOps days
 */
export function days(self: number): Duration {
  return new Duration(Math.round(self * 86400000));
}

/**
 * @tsplus pipeable-operator fncts.Duration *
 */
export function product(multiplicand: number) {
  return (self: Duration): Duration => {
    return new Duration(self.milliseconds * Math.round(multiplicand));
  };
}

/**
 * @tsplus operator fncts.Duration *
 */
export function multiplyInverted(multiplicand: number, self: Duration) {
  return new Duration(Math.round(self.milliseconds) * multiplicand);
}

/**
 * @tsplus pipeable-operator fncts.Duration +
 */
export function sum(that: Duration) {
  return (self: Duration): Duration => {
    return new Duration(self.milliseconds + that.milliseconds);
  };
}

/**
 * @tsplus pipeable-operator fncts.Duration -
 */
export function difference(that: Duration) {
  return (self: Duration): Duration => {
    return new Duration(self.milliseconds - that.milliseconds);
  };
}

/**
 * @tsplus static fncts.DurationOps fromInterval
 */
export function fromInterval(start: number, end: number): Duration {
  return Duration.milliseconds(Math.round(end) - Math.round(start));
}
