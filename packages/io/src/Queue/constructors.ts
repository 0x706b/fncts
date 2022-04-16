import type { Queue } from "@fncts/io/Queue/definition";

import { bounded, unbounded } from "@fncts/io/internal/MutableQueue";
import { _makeQueue } from "@fncts/io/Queue/internal";
import { BackPressureStrategy, DroppingStrategy, SlidingStrategy } from "@fncts/io/Queue/strategy";

/**
 * @tsplus static fncts.control.QueueOps makeSliding
 */
export function makeSliding<A>(capacity: number): UIO<Queue<A>> {
  return IO.succeed(bounded<A>(capacity)).flatMap(_makeQueue(new SlidingStrategy()));
}

/**
 * @tsplus static fncts.control.QueueOps makeUnbounded
 */
export function makeUnbounded<A>(): UIO<Queue<A>> {
  return IO.succeed(unbounded<A>()).flatMap(_makeQueue(new DroppingStrategy()));
}

/**
 * @tsplus static fncts.control.QueueOps makeDropping
 */
export function makeDropping<A>(capacity: number): UIO<Queue<A>> {
  return IO.succeed(bounded<A>(capacity)).flatMap(_makeQueue(new DroppingStrategy()));
}

/**
 * @tsplus static fncts.control.QueueOps makeBounded
 */
export function makeBounded<A>(capacity: number): UIO<Queue<A>> {
  return IO.succeed(bounded<A>(capacity)).flatMap(_makeQueue(new BackPressureStrategy()));
}
