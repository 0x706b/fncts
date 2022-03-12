import type { Maybe } from "../../data/Maybe.js";

import { Just, Nothing } from "../../data/Maybe.js";

/**
 * @tsplus type fncts.control.Schedule.Interval
 * @tsplus companion fncts.control.Schedule.IntervalOps
 */
export class Interval {
  constructor(readonly startMilliseconds: number, readonly endMilliseconds: number) {}
}

/**
 * @tsplus static fncts.control.Schedule.IntervalOps after
 */
export function after(start: number): Interval {
  return Interval(start, Number.MAX_SAFE_INTEGER);
}

/**
 * @tsplus static fncts.control.Schedule.IntervalOps before
 */
export function before(end: number): Interval {
  return Interval(Number.MIN_SAFE_INTEGER, end);
}

/**
 * @tsplus static fncts.control.Schedule.IntervalOps empty
 */
export const empty: Interval = new Interval(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);

/**
 * @tsplus getter fncts.control.Schedule.Interval isEmpty
 */
export function isEmpty(self: Interval): boolean {
  return self.startMilliseconds >= self.endMilliseconds;
}

/**
 * @tsplus fluent fncts.control.Schedule.Interval intersect
 */
export function intersect_(self: Interval, that: Interval): Interval {
  const start = Math.max(self.startMilliseconds, that.startMilliseconds);
  const end   = Math.min(self.endMilliseconds, that.endMilliseconds);
  return Interval(start, end);
}

/**
 * @tsplus fluent fncts.control.Schedule.Interval lt
 * @tsplus operator fncts.control.Schedule.Interval <
 */
export function lt_(self: Interval, that: Interval): boolean {
  return self.min(that) === self;
}

/**
 * @tsplus static fncts.control.Schedule.IntervalOps __call
 */
export function makeInterval(start: number, end: number): Interval {
  if (start <= end) return Interval(start, end);
  else return Interval.empty;
}

/**
 * @tsplus fluent fncts.control.Schedule.Interval max
 */
export function max_(self: Interval, that: Interval): Interval {
  const m = self.min(that);
  if (m === self) return that;
  else return self;
}

/**
 * @tsplus fluent fncts.control.Schedule.Interval min
 */
export function min_(self: Interval, that: Interval): Interval {
  if (self.endMilliseconds <= that.startMilliseconds) return self;
  if (that.endMilliseconds <= self.startMilliseconds) return that;
  if (self.startMilliseconds < that.startMilliseconds) return self;
  if (that.startMilliseconds < self.startMilliseconds) return that;
  if (self.endMilliseconds <= that.endMilliseconds) return self;
  return that;
}

/**
 * @tsplus getter fncts.control.Schedule.Interval isNonEmpty
 */
export function isNonEmpty(self: Interval): boolean {
  return !self.isEmpty;
}

/**
 * @tsplus getter fncts.control.Schedule.Interval size
 */
export function size(self: Interval): number {
  return self.endMilliseconds - self.startMilliseconds;
}

/**
 * @tsplus fluent fncts.control.Schedule.Interval union
 */
export function union_(self: Interval, that: Interval): Maybe<Interval> {
  const istart = Math.max(self.startMilliseconds, that.startMilliseconds);
  const iend   = Math.min(self.endMilliseconds, that.endMilliseconds);
  if (istart <= iend) return Nothing();
  else return Just(Interval(istart, iend));
}
