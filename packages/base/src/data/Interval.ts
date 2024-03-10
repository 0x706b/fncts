/**
 * @tsplus type fncts.io.Schedule.Interval
 * @tsplus companion fncts.io.Schedule.IntervalOps
 */
export class Interval {
  constructor(
    readonly startMilliseconds: number,
    readonly endMilliseconds: number,
  ) {}
}

/**
 * @tsplus static fncts.io.Schedule.IntervalOps after
 */
export function after(start: number): Interval {
  return Interval(start, Number.MAX_SAFE_INTEGER);
}

/**
 * @tsplus static fncts.io.Schedule.IntervalOps before
 */
export function before(end: number): Interval {
  return Interval(Number.MIN_SAFE_INTEGER, end);
}

/**
 * @tsplus static fncts.io.Schedule.IntervalOps empty
 */
export const empty: Interval = new Interval(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);

/**
 * @tsplus getter fncts.io.Schedule.Interval isEmpty
 */
export function isEmpty(self: Interval): boolean {
  return self.startMilliseconds >= self.endMilliseconds;
}

/**
 * @tsplus pipeable fncts.io.Schedule.Interval intersect
 */
export function intersect_(that: Interval) {
  return (self: Interval): Interval => {
    const start = Math.max(self.startMilliseconds, that.startMilliseconds);
    const end   = Math.min(self.endMilliseconds, that.endMilliseconds);
    return Interval(start, end);
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule.Interval lt
 * @tsplus pipeable-operator fncts.io.Schedule.Interval <
 */
export function lt(that: Interval) {
  return (self: Interval): boolean => {
    return self.min(that) === self;
  };
}

/**
 * @tsplus static fncts.io.Schedule.IntervalOps __call
 */
export function makeInterval(start: number, end: number): Interval {
  if (start <= end) return new Interval(start, end);
  else return Interval.empty;
}

/**
 * @tsplus pipeable fncts.io.Schedule.Interval max
 */
export function max(that: Interval) {
  return (self: Interval): Interval => {
    const m = self.min(that);
    if (m === self) return that;
    else return self;
  };
}

/**
 * @tsplus pipeable fncts.io.Schedule.Interval min
 */
export function min(that: Interval) {
  return (self: Interval): Interval => {
    if (self.endMilliseconds <= that.startMilliseconds) return self;
    if (that.endMilliseconds <= self.startMilliseconds) return that;
    if (self.startMilliseconds < that.startMilliseconds) return self;
    if (that.startMilliseconds < self.startMilliseconds) return that;
    if (self.endMilliseconds <= that.endMilliseconds) return self;
    return that;
  };
}

/**
 * @tsplus getter fncts.io.Schedule.Interval isNonEmpty
 */
export function isNonEmpty(self: Interval): boolean {
  return !self.isEmpty;
}

/**
 * @tsplus getter fncts.io.Schedule.Interval size
 */
export function size(self: Interval): Duration {
  return Duration.fromInterval(self.startMilliseconds, self.endMilliseconds);
}

/**
 * @tsplus pipeable fncts.io.Schedule.Interval union
 */
export function union(that: Interval) {
  return (self: Interval): Maybe<Interval> => {
    const istart = Math.max(self.startMilliseconds, that.startMilliseconds);
    const iend   = Math.min(self.endMilliseconds, that.endMilliseconds);
    if (istart <= iend) return Nothing();
    else return Just(Interval(istart, iend));
  };
}
