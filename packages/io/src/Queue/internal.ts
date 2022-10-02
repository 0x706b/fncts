import type { MutableQueue } from "@fncts/io/internal/MutableQueue";
import type { Queue } from "@fncts/io/Queue/definition";
import type { Strategy } from "@fncts/io/Queue/strategy";

import { AtomicBoolean } from "@fncts/base/internal/AtomicBoolean";
import { unbounded } from "@fncts/io/internal/MutableQueue";

export function unsafeOfferAll<A>(q: MutableQueue<A>, as: Conc<A>): Conc<A> {
  let bs = as;

  while (bs.length > 0) {
    if (!q.enqueue(bs.unsafeGet(0))) {
      return bs;
    } else {
      bs = bs.drop(1);
    }
  }

  return bs;
}

export function unsafePollAll<A>(q: MutableQueue<A>): Conc<A> {
  let as = Conc.empty<A>();

  while (!q.isEmpty) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    as = as.append(q.dequeue(undefined)!);
  }

  return as;
}

export function unsafeCompletePromise<A>(p: Future<never, A>, a: A) {
  return p.unsafeDone(IO.succeedNow(a));
}

export function unsafeRemove<A>(q: MutableQueue<A>, a: A) {
  return unsafeOfferAll(q, unsafePollAll(q)).filter((b) => a !== b);
}

export function unsafePollN<A>(q: MutableQueue<A>, max: number): Conc<A> {
  let j  = 0;
  let as = Conc.empty<A>();

  while (j < max) {
    const p = q.dequeue(undefined);

    if (p != null) {
      as = as.append(p);
    } else {
      return as;
    }

    j += 1;
  }

  return as;
}

export function unsafeCompleteTakers<A>(
  strategy: Strategy<A>,
  queue: MutableQueue<A>,
  takers: MutableQueue<Future<never, A>>,
): void {
  let keepPolling = true;

  while (keepPolling && !queue.isEmpty) {
    const taker = takers.dequeue(undefined);

    if (taker != null) {
      const element = queue.dequeue(undefined);

      if (element != null) {
        unsafeCompletePromise(taker, element);
        strategy.unsafeOnQueueEmptySpace(queue, takers);
      } else {
        unsafeOfferAll(takers, unsafePollAll(takers).prepend(taker));
      }

      keepPolling = true;
    } else {
      keepPolling = false;
    }
  }
}
