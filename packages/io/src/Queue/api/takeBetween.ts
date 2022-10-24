import type { PDequeue } from "@fncts/io/Queue/definition";

import { concrete } from "@fncts/io/Queue/definition";

/**
 * Takes between min and max number of values from the queue. If there
 * is less than min items available, it'll block until the items are
 * collected.
 *
 * @tsplus pipeable fncts.io.Queue takeBetween
 */
export function takeBetween(min: number, max: number, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A, B>(queue: PDequeue<RA, RB, EA, EB, A, B>): IO<RB, EB, Conc<B>> => {
    concrete(queue);
    if (max < min) {
      return IO.succeedNow(Conc.empty());
    } else {
      return queue.takeUpTo(max).flatMap((bs) => {
        const remaining = min - bs.length;

        if (remaining === 1) {
          return queue.take.map((b) => bs.prepend(b));
        } else if (remaining > 1) {
          return takeRemainderLoop(queue, remaining - 1).map((list) => bs.concat(list));
        } else {
          return IO.succeedNow(bs);
        }
      });
    }
  };
}

function takeRemainderLoop<RA, RB, EA, EB, A, B>(
  queue: PDequeue<RA, RB, EA, EB, A, B>,
  n: number,
  __tsplusTrace?: string,
): IO<RB, EB, Conc<B>> {
  concrete(queue);
  if (n <= 0) {
    return IO.succeedNow(Conc.empty());
  } else {
    return queue.take.flatMap((b) => takeRemainderLoop(queue, n - 1).map((out) => out.prepend(b)));
  }
}
