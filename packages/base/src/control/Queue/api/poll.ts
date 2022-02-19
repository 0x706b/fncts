import type { Maybe } from "../../../data/Maybe";
import type { IO } from "../../IO";
import type { Queue } from "../definition";

import { concrete } from "../definition";

/**
 * Take the head option of values in the queue.
 *
 * @tsplus getter fncts.control.Queue poll
 */
export function poll<RA, RB, EA, EB, A, B>(
  queue: Queue<RA, RB, EA, EB, A, B>
): IO<RB, EB, Maybe<B>> {
  concrete(queue);
  return queue.takeUpTo(1).map((bs) => bs.head);
}
