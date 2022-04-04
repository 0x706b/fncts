import type { Queue } from "@fncts/base/control/Queue/definition";

import { _makeQueue } from "@fncts/base/control/Queue/internal";
import {
  BackPressureStrategy,
  DroppingStrategy,
  SlidingStrategy,
} from "@fncts/base/control/Queue/strategy";
import { bounded, unbounded } from "@fncts/base/internal/MutableQueue.js";

/**
 * @tsplus static fncts.control.QueueOps makeSliding
 */
export function makeSliding<A>(capacity: number): UIO<Queue<A>> {
  return IO.succeed(bounded<A>(capacity)).chain(_makeQueue(new SlidingStrategy()));
}

/**
 * @tsplus static fncts.control.QueueOps makeUnbounded
 */
export function makeUnbounded<A>(): UIO<Queue<A>> {
  return IO.succeed(unbounded<A>()).chain(_makeQueue(new DroppingStrategy()));
}

/**
 * @tsplus static fncts.control.QueueOps makeDropping
 */
export function makeDropping<A>(capacity: number): UIO<Queue<A>> {
  return IO.succeed(bounded<A>(capacity)).chain(_makeQueue(new DroppingStrategy()));
}

/**
 * @tsplus static fncts.control.QueueOps makeBounded
 */
export function makeBounded<A>(capacity: number): UIO<Queue<A>> {
  return IO.succeed(bounded<A>(capacity)).chain(_makeQueue(new BackPressureStrategy()));
}
