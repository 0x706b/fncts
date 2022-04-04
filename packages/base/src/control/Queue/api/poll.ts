import { concrete } from "@fncts/base/control/Queue/definition";

/**
 * Take the head option of values in the queue.
 *
 * @tsplus getter fncts.control.Queue poll
 */
export function poll<RA, RB, EA, EB, A, B>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
): IO<RB, EB, Maybe<B>> {
  concrete(queue);
  return queue.takeUpTo(1).map((bs) => bs.head);
}
