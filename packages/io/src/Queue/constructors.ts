import type { Queue } from "@fncts/io/Queue/definition";

import { bounded, unbounded } from "@fncts/io/internal/MutableQueue";
import { _makeQueue } from "@fncts/io/Queue/internal";
import { BackPressureStrategy, DroppingStrategy, SlidingStrategy } from "@fncts/io/Queue/strategy";

/**
 * @tsplus static fncts.io.QueueOps makeSliding
 */
export function makeSliding<A>(capacity: number, __tsplusTrace?: string): UIO<Queue<A>> {
  return IO.succeed(bounded<A>(capacity)).flatMap(_makeQueue(new SlidingStrategy()));
}

/**
 * @tsplus static fncts.io.QueueOps makeUnbounded
 */
export function makeUnbounded<A>(__tsplusTrace?: string): UIO<Queue<A>> {
  return IO.succeed(unbounded<A>()).flatMap(_makeQueue(new DroppingStrategy()));
}

/**
 * @tsplus static fncts.io.QueueOps makeDropping
 */
export function makeDropping<A>(capacity: number, __tsplusTrace?: string): UIO<Queue<A>> {
  return IO.succeed(bounded<A>(capacity)).flatMap(_makeQueue(new DroppingStrategy()));
}

/**
 * @tsplus static fncts.io.QueueOps makeBounded
 */
export function makeBounded<A>(capacity: number, __tsplusTrace?: string): UIO<Queue<A>> {
  return IO.succeed(bounded<A>(capacity)).flatMap(_makeQueue(new BackPressureStrategy()));
}
