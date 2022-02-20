import type { PQueue } from "../definition";

import { Conc } from "../../../collection/immutable/Conc";
import { IO } from "../../IO";
import { concrete } from "../definition";

function takeRemainderLoop<RA, RB, EA, EB, A, B>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
  n: number
): IO<RB, EB, Conc<B>> {
  concrete(queue);
  if (n <= 0) {
    return IO.succeedNow(Conc.empty());
  } else {
    return queue.take.chain((b) =>
      takeRemainderLoop(queue, n - 1).map((out) => out.prepend(b))
    );
  }
}

/**
 * Takes between min and max number of values from the queue. If there
 * is less than min items available, it'll block until the items are
 * collected.
 *
 * @tsplus fluent fncts.control.Queue takeBetween
 */
export function takeBetween_<RA, RB, EA, EB, A, B>(
  queue: PQueue<RA, RB, EA, EB, A, B>,
  min: number,
  max: number
): IO<RB, EB, Conc<B>> {
  concrete(queue);
  if (max < min) {
    return IO.succeedNow(Conc.empty());
  } else {
    return pipe(
      queue.takeUpTo(max).chain((bs) => {
        const remaining = min - bs.length;

        if (remaining === 1) {
          return queue.take.map((b) => bs.prepend(b));
        } else if (remaining > 1) {
          return takeRemainderLoop(queue, remaining - 1).map((list) =>
            bs.concat(list)
          );
        } else {
          return IO.succeedNow(bs);
        }
      })
    );
  }
}

// codegen:start { preset: pipeable }
/**
 * Takes between min and max number of values from the queue. If there
 * is less than min items available, it'll block until the items are
 * collected.
 * @tsplus dataFirst takeBetween_
 */
export function takeBetween(min: number, max: number) {
  return <RA, RB, EA, EB, A, B>(
    queue: PQueue<RA, RB, EA, EB, A, B>
  ): IO<RB, EB, Conc<B>> => takeBetween_(queue, min, max);
}
// codegen:end
