/**
 * @tsplus type fncts.Intervals
 * @tsplus companion fncts.IntervalsOps
 */
export class Intervals {
  constructor(readonly intervals: List<Interval>) {}
}

/**
 * @tsplus static fncts.IntervalsOps __call
 */
export function make(intervals: List<Interval>): Intervals {
  return new Intervals(intervals);
}

/**
 * @tsplus pipeable fncts.Intervals union
 * @tsplus pipeable-operator fncts.Intervals ||
 */
export function union(that: Intervals) {
  return (self: Intervals): Intervals => {
    if (that.intervals.isEmpty()) {
      return self;
    } else if (self.intervals.isEmpty()) {
      return that;
    } else if (self.intervals.head.startMilliseconds < that.intervals.head.startMilliseconds) {
      return unionLoop(self.intervals.tail, that.intervals, self.intervals.head, Nil());
    } else {
      return unionLoop(self.intervals, that.intervals.tail, that.intervals.head, Nil());
    }
  };
}

/**
 * @tsplus tailRec
 */
function unionLoop(left: List<Interval>, right: List<Interval>, interval: Interval, acc: List<Interval>): Intervals {
  if (left.isEmpty() && right.isEmpty()) {
    return Intervals((interval + acc).reverse);
  } else if (left.isEmpty() && right.isNonEmpty()) {
    const rightHead = right.head;
    const rights    = right.tail;
    if (interval.endMilliseconds < rightHead.startMilliseconds)
      return unionLoop(Nil(), rights, rightHead, interval + acc);
    else return unionLoop(Nil(), rights, Interval(interval.startMilliseconds, rightHead.endMilliseconds), acc);
  } else if (left.isNonEmpty() && right.isEmpty()) {
    const leftHead = left.head;
    const lefts    = left.tail;
    if (interval.endMilliseconds < leftHead.startMilliseconds) return unionLoop(lefts, Nil(), leftHead, interval + acc);
    else return unionLoop(lefts, Nil(), Interval(interval.startMilliseconds, leftHead.endMilliseconds), acc);
  } else {
    const leftHead  = left.unsafeHead;
    const lefts     = left.unsafeTail;
    const rightHead = right.unsafeHead;
    const rights    = right.unsafeTail;
    if (leftHead.startMilliseconds < rightHead.startMilliseconds) {
      if (interval.endMilliseconds < leftHead.startMilliseconds)
        return unionLoop(lefts, right, leftHead, interval + acc);
      else return unionLoop(lefts, right, Interval(interval.startMilliseconds, leftHead.endMilliseconds), acc);
    } else {
      if (interval.endMilliseconds < rightHead.startMilliseconds)
        return unionLoop(left, rights, rightHead, interval + acc);
      else return unionLoop(left, rights, Interval(interval.startMilliseconds, rightHead.endMilliseconds), acc);
    }
  }
}

/**
 * @tsplus pipeable fncts.Intervals intersect
 * @tsplus pipeable-operator fncts.Intervals &&
 */
export function intersect(that: Intervals) {
  return (self: Intervals): Intervals => {
    return intersectLoop(self.intervals, that.intervals, Nil());
  };
}

/**
 * @tsplus tailRec
 */
function intersectLoop(left: List<Interval>, right: List<Interval>, acc: List<Interval>): Intervals {
  if (left.isEmpty() || right.isEmpty()) {
    return Intervals(acc.reverse);
  } else {
    const leftHead  = left.head;
    const lefts     = left.tail;
    const rightHead = right.head;
    const rights    = right.tail;
    const interval  = leftHead.intersect(rightHead);
    const intervals = interval.isEmpty ? acc : interval + acc;
    if (leftHead < rightHead) return intersectLoop(lefts, right, intervals);
    else return intersectLoop(left, rights, intervals);
  }
}

/**
 * @tsplus getter fncts.Intervals start
 */
export function start(self: Intervals): number {
  return self.intervals.head.getOrElse(Interval.empty).startMilliseconds;
}

/**
 * @tsplus getter fncts.Intervals end
 */
export function end(self: Intervals): number {
  return self.intervals.head.getOrElse(Interval.empty).endMilliseconds;
}

/**
 * @tsplus pipeable fncts.Intervals lt
 * @tsplus pipeable-operator fncts.Intervals <
 */
export function lt(that: Intervals) {
  return (self: Intervals): boolean => {
    return self.start < that.start;
  };
}

/**
 * @tsplus pipeable fncts.Intervals max
 */
export function max(that: Intervals) {
  return (self: Intervals): Intervals => {
    return self < that ? that : self;
  };
}

/**
 * @tsplus getter fncts.Intervals isNonEmpty
 */
export function isNonEmpty(self: Intervals): boolean {
  return self.intervals.isNonEmpty();
}
