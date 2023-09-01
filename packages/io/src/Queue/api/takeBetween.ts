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
    return takeRemainderLoop(queue, min, max, Conc.empty());
  };
}

function takeRemainderLoop<RA, RB, EA, EB, A, B>(
  queue: PDequeue<RA, RB, EA, EB, A, B>,
  min: number,
  max: number,
  acc: Conc<B>,
  __tsplusTrace?: string,
): IO<RB, EB, Conc<B>> {
  concrete(queue);
  if (max < min) {
    return IO.succeedNow(acc);
  } else {
    return queue.takeUpTo(max).flatMap((bs) => {
      const remaining = min - bs.length;
      if (remaining === 1) {
        return queue.take.map((b) => acc.concat(bs).append(b));
      } else if (remaining > 1) {
        return queue.take.flatMap((b) =>
          takeRemainderLoop(queue, remaining - 1, max - bs.length - 1, acc.concat(bs).append(b)),
        );
      } else {
        return IO.succeed(acc.concat(bs));
      }
    });
  }
}
