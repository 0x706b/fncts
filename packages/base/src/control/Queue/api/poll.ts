import type { Maybe } from "../../../data/Maybe.js";
import type { IO } from "../../IO.js";
import type { PQueue } from "../definition.js";

import { concrete } from "../definition.js";

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
