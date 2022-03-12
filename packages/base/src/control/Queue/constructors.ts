import type { UIO } from "../IO.js";
import type { Queue } from "./definition.js";

import { bounded, unbounded } from "../../internal/MutableQueue.js";
import { IO } from "../IO.js";
import { _makeQueue } from "./internal.js";
import { BackPressureStrategy, DroppingStrategy, SlidingStrategy } from "./strategy.js";

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
