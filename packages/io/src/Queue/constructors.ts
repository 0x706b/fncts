import type { MutableQueue } from "@fncts/io/internal/MutableQueue";
import type { Strategy } from "@fncts/io/Queue/strategy";

import { AtomicBoolean } from "@fncts/base/internal/AtomicBoolean";
import { bounded, unbounded } from "@fncts/io/internal/MutableQueue";
import { Queue } from "@fncts/io/Queue/definition";
import { BackPressureStrategy, DroppingStrategy, SlidingStrategy } from "@fncts/io/Queue/strategy";

/**
 * @tsplus static fncts.io.QueueOps makeSliding
 */
export function makeSliding<A>(capacity: number, __tsplusTrace?: string): UIO<Queue<A>> {
  return IO.succeed(bounded<A>(capacity)).flatMap((queue) => createQueue(queue, new SlidingStrategy()));
}

/**
 * @tsplus static fncts.io.QueueOps makeUnbounded
 */
export function makeUnbounded<A>(__tsplusTrace?: string): UIO<Queue<A>> {
  return IO.succeed(unbounded<A>()).flatMap((queue) => createQueue(queue, new DroppingStrategy()));
}

/**
 * @tsplus static fncts.io.QueueOps makeDropping
 */
export function makeDropping<A>(capacity: number, __tsplusTrace?: string): UIO<Queue<A>> {
  return IO.succeed(bounded<A>(capacity)).flatMap((queue) => createQueue(queue, new DroppingStrategy()));
}

/**
 * @tsplus static fncts.io.QueueOps makeBounded
 */
export function makeBounded<A>(capacity: number, __tsplusTrace?: string): UIO<Queue<A>> {
  return IO.succeed(bounded<A>(capacity)).flatMap((queue) => createQueue(queue, new BackPressureStrategy()));
}

function unsafeCreate<A>(
  queue: MutableQueue<A>,
  takers: MutableQueue<Future<never, A>>,
  shutdownHook: Future<never, void>,
  shutdownFlag: AtomicBoolean,
  strategy: Strategy<A>,
): Queue<A> {
  return new Queue(queue, takers, shutdownHook, shutdownFlag, strategy);
}

function createQueue<A>(queue: MutableQueue<A>, strategy: Strategy<A>): UIO<Queue<A>> {
  return Future.make<never, void>().map((p) => unsafeCreate(queue, unbounded(), p, new AtomicBoolean(false), strategy));
}
