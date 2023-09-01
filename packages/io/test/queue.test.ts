import { deepEqualTo } from "@fncts/test/control/Assertion";
import { Gen } from "@fncts/test/control/Gen";

suite.concurrent("Queue", () => {
  test.io(
    "sequential offer and take",
    Do((Δ) => {
      const queue = Δ(Queue.makeBounded<number>(100));
      const o1    = Δ(queue.offer(10));
      const v1    = Δ(queue.take);
      const o2    = Δ(queue.offer(20));
      const v2    = Δ(queue.take);
      return v1.assert(strictEqualTo(10)) && v2.assert(strictEqualTo(20)) && o1.assert(isTrue) && o2.assert(isTrue);
    }),
  );
  test.io(
    "sequential take and offer",
    Do((Δ) => {
      const queue = Δ(Queue.makeBounded<string>(100));
      const f1    = Δ(queue.take.zipWith(queue.take, (a, b) => a + b).fork);
      Δ(queue.offer("don't ") > queue.offer("give up :D"));
      const v = Δ(f1.join);
      return v.assert(strictEqualTo("don't give up :D"));
    }),
  );
  test.io(
    "parallel takes and sequential offers",
    Do((Δ) => {
      const queue  = Δ(Queue.makeBounded<number>(10));
      const f      = Δ(IO.forkAll(Conc.replicate(10, queue.take)));
      const values = Conc.range(1, 10);
      Δ(values.map((n) => queue.offer(n)).foldLeft(IO.succeedNow(false), (b, a) => b > a));
      const v = Δ(f.join);
      return v.assert(deepEqualTo(values));
    }),
  );
  test.io(
    "parallel offers and sequential takes",
    Do((Δ) => {
      const queue  = Δ(Queue.makeBounded<number>(10));
      const values = Conc.range(1, 10);
      const f      = Δ(IO.forkAll(values.map((n) => queue.offer(n))));
      Δ(waitForSize(queue, 10));
      const out = Δ(Ref.make<Conc<number>>(Conc()));
      Δ(queue.take.flatMap((i) => out.update((ns) => ns.append(i))).repeatN(9));
      const l = Δ(out.get);
      Δ(f.join);
      return l.assert(deepEqualTo(values));
    }),
  );
  test.io(
    "offers are suspended by back pressure",
    Do((Δ) => {
      const queue = Δ(Queue.makeBounded<number>(10));
      Δ(queue.offer(1).repeatN(9));
      const refSuspended = Δ(Ref.make<boolean>(true));
      const f            = Δ((queue.offer(2) > refSuspended.set(false)).fork);
      Δ(waitForSize(queue, 11));
      const isSuspended = Δ(refSuspended.get);
      Δ(f.interrupt);
      return isSuspended.assert(isTrue);
    }),
  );
  test.io(
    "back pressured offers are retrieved",
    Do((Δ) => {
      const queue  = Δ(Queue.makeBounded<number>(5));
      const values = Conc.range(1, 10);
      const f      = Δ(IO.forkAll(values.map((n) => queue.offer(n))));
      Δ(waitForSize(queue, 10));
      const out = Δ(Ref.make<Conc<number>>(Conc()));
      Δ(queue.take.flatMap((i) => out.update((ns) => ns.append(i))).repeatN(9));
      const l = Δ(out.get);
      Δ(f.join);
      return l.assert(deepEqualTo(values));
    }),
  );
  test.io(
    "take interruption",
    Do((Δ) => {
      const queue = Δ(Queue.makeBounded<number>(100));
      const f     = Δ(queue.take.fork);
      Δ(waitForSize(queue, -1));
      Δ(f.interrupt);
      const size = Δ(queue.size);
      return size.assert(strictEqualTo(0));
    }),
  );
  test.io(
    "offer interruption",
    Do((Δ) => {
      const queue = Δ(Queue.makeBounded<number>(2));
      Δ(queue.offer(1));
      Δ(queue.offer(1));
      const f = Δ(queue.offer(1).fork);
      Δ(waitForSize(queue, 3));
      Δ(f.interrupt);
      const size = Δ(queue.size);
      return size.assert(strictEqualTo(2));
    }),
  );
  test.io(
    "queue is ordered",
    Do((Δ) => {
      const queue = Δ(Queue.makeUnbounded<number>());
      Δ(queue.offer(1));
      Δ(queue.offer(2));
      Δ(queue.offer(3));
      const v1 = Δ(queue.take);
      const v2 = Δ(queue.take);
      const v3 = Δ(queue.take);
      return v1.assert(strictEqualTo(1)) && v2.assert(strictEqualTo(2)) && v3.assert(strictEqualTo(3));
    }),
  );
  test.io(
    "takeAll",
    Do((Δ) => {
      const queue = Δ(Queue.makeUnbounded<number>());
      Δ(queue.offer(1));
      Δ(queue.offer(2));
      Δ(queue.offer(3));
      const v = Δ(queue.takeAll);
      return v.assert(deepEqualTo(Conc(1, 2, 3)));
    }),
  );
  test.io(
    "takeAll with empty queue",
    Do((Δ) => {
      const queue = Δ(Queue.makeUnbounded<number>());
      const c     = Δ(queue.takeAll);
      Δ(queue.offer(1));
      Δ(queue.take);
      const v = Δ(queue.takeAll);
      return c.assert(deepEqualTo(Conc.empty())) && v.assert(deepEqualTo(Conc.empty()));
    }),
  );
  test.io(
    "takeAll doesn't return more than the queue size",
    Do((Δ) => {
      const queue  = Δ(Queue.makeBounded<number>(4));
      const values = Conc(1, 2, 3, 4);
      Δ(values.map((n) => queue.offer(n)).foldLeft(IO.succeed(false), (b, a) => b > a));
      Δ(queue.offer(5).fork);
      Δ(waitForSize(queue, 5));
      const v = Δ(queue.takeAll);
      const c = Δ(queue.take);
      return v.assert(deepEqualTo(values)) && c.assert(strictEqualTo(5));
    }),
  );
  test.io(
    "takeUpTo",
    Do((Δ) => {
      const queue = Δ(Queue.makeBounded<number>(100));
      Δ(queue.offer(10));
      Δ(queue.offer(20));
      const chunk = Δ(queue.takeUpTo(2));
      return chunk.assert(deepEqualTo(Conc(10, 20)));
    }),
  );
  test.io(
    "takeUpTo with empty queue",
    Do((Δ) => {
      const queue = Δ(Queue.makeBounded<number>(100));
      const chunk = Δ(queue.takeUpTo(2));
      return chunk.isEmpty.assert(isTrue);
    }),
  );
  test.io(
    "takeUpTo with empty queue, with max higher than queue size",
    Do((Δ) => {
      const queue = Δ(Queue.makeBounded<number>(100));
      const chunk = Δ(queue.takeUpTo(101));
      return chunk.isEmpty.assert(isTrue);
    }),
  );
  test.io(
    "takeUpTo with remaining items",
    Do((Δ) => {
      const queue = Δ(Queue.makeBounded<number>(100));
      Δ(queue.offer(10));
      Δ(queue.offer(20));
      Δ(queue.offer(30));
      Δ(queue.offer(40));
      const chunk = Δ(queue.takeUpTo(2));
      return chunk.assert(deepEqualTo(Conc(10, 20)));
    }),
  );
  test.io(
    "takeUpTo with not enough items",
    Do((Δ) => {
      const queue = Δ(Queue.makeBounded<number>(100));
      Δ(queue.offer(10));
      Δ(queue.offer(20));
      Δ(queue.offer(30));
      Δ(queue.offer(40));
      const chunk = Δ(queue.takeUpTo(10));
      return chunk.assert(deepEqualTo(Conc(10, 20, 30, 40)));
    }),
  );
  test.io(
    "takeUpTo 0",
    Do((Δ) => {
      const queue = Δ(Queue.makeBounded<number>(100));
      Δ(queue.offer(10));
      Δ(queue.offer(20));
      Δ(queue.offer(30));
      Δ(queue.offer(40));
      const chunk = Δ(queue.takeUpTo(0));
      return chunk.isEmpty.assert(isTrue);
    }),
  );
  test.io(
    "takeUpTo -1",
    Do((Δ) => {
      const queue = Δ(Queue.makeBounded<number>(100));
      Δ(queue.offer(10));
      const chunk = Δ(queue.takeUpTo(-1));
      return chunk.isEmpty.assert(isTrue);
    }),
  );
  test.io(
    "takeUpTo Number.MAX_VALUE",
    Do((Δ) => {
      const queue = Δ(Queue.makeBounded<number>(100));
      Δ(queue.offer(10));
      const chunk = Δ(queue.takeUpTo(Number.MAX_VALUE));
      return chunk.assert(deepEqualTo(Conc(10)));
    }),
  );
  test.io(
    "multiple takeUpTo",
    Do((Δ) => {
      const queue = Δ(Queue.makeBounded<number>(100));
      Δ(queue.offer(10));
      Δ(queue.offer(20));
      const chunk1 = Δ(queue.takeUpTo(2));
      Δ(queue.offer(30));
      Δ(queue.offer(40));
      const chunk2 = Δ(queue.takeUpTo(2));
      return chunk1.assert(deepEqualTo(Conc(10, 20))) && chunk2.assert(deepEqualTo(Conc(30, 40)));
    }),
  );
  test.io(
    "consecutive takeUpTo",
    Do((Δ) => {
      const queue = Δ(Queue.makeBounded<number>(100));
      Δ(queue.offer(10));
      Δ(queue.offer(20));
      Δ(queue.offer(30));
      Δ(queue.offer(40));
      const chunk1 = Δ(queue.takeUpTo(2));
      const chunk2 = Δ(queue.takeUpTo(2));
      return chunk1.assert(deepEqualTo(Conc(10, 20))) && chunk2.assert(deepEqualTo(Conc(30, 40)));
    }),
  );
  test.io(
    "takeUpTo doesn't return back-pressured offers",
    Do((Δ) => {
      const queue  = Δ(Queue.makeBounded<number>(4));
      const values = Conc(1, 2, 3, 4);
      Δ(values.map((n) => queue.offer(n)).foldLeft(IO.succeedNow(false), (b, a) => b > a));
      const f = Δ(queue.offer(5).fork);
      Δ(waitForSize(queue, 5));
      const c = Δ(queue.takeUpTo(5));
      Δ(f.interrupt);
      return c.assert(deepEqualTo(Conc(1, 2, 3, 4)));
    }),
  );
  suite.concurrent("takeBetween", () => {
    test.io(
      "returns immediately if there are enough elements",
      Do((Δ) => {
        const queue = Δ(Queue.makeBounded<number>(100));
        Δ(queue.offer(10));
        Δ(queue.offer(20));
        Δ(queue.offer(30));
        const res = Δ(queue.takeBetween(2, 5));
        return res.assert(deepEqualTo(Conc(10, 20, 30)));
      }),
    );
    test.io(
      "returns an empty list if boundaries are inverted",
      Do((Δ) => {
        const queue = Δ(Queue.makeBounded<number>(100));
        Δ(queue.offer(10));
        Δ(queue.offer(20));
        Δ(queue.offer(30));
        const res = Δ(queue.takeBetween(5, 2));
        return res.assert(isEmpty);
      }),
    );
    test.io(
      "returns an empty list if boundaries are negative",
      Do((Δ) => {
        const queue = Δ(Queue.makeBounded<number>(100));
        Δ(queue.offer(10));
        Δ(queue.offer(20));
        Δ(queue.offer(30));
        const res = Δ(queue.takeBetween(-5, -2));
        return res.assert(isEmpty);
      }),
    );
    test.io(
      "blocks until a required minimum of elements is collected",
      Do((Δ) => {
        const queue   = Δ(Queue.makeBounded<number>(100));
        const updater = queue.offer(10).forever;
        const getter  = queue.takeBetween(5, 10);
        const res     = Δ(getter.race(updater));
        return res.assert(hasSize(isGreaterThanOrEqualTo(5)));
      }),
    );
    test.io(
      "returns elements in the correct order",
      Gen.conc(Gen.intWith({ min: -10, max: 10 })).check((as) =>
        Do((Δ) => {
          const queue = Δ(Queue.makeBounded<number>(100));
          const f     = Δ(IO.foreach(as, (n) => queue.offer(n)).fork);
          const bs    = Δ(queue.takeBetween(as.length, as.length));
          Δ(f.interrupt);
          return as.assert(deepEqualTo(bs));
        }),
      ),
    );
  });
  suite.concurrent("takeN", () => {
    test.io(
      "returns immediately if there are enough elements",
      Do((Δ) => {
        const queue = Δ(Queue.makeBounded<number>(100));
        Δ(queue.offerAll(Conc(1, 2, 3, 4, 5)));
        const res = Δ(queue.takeN(5));
        return res.assert(deepEqualTo(Conc(1, 2, 3, 4, 5)));
      }),
    );
    test.io(
      "returns an empty list if a negative number or zero is specified",
      Do((Δ) => {
        const queue = Δ(Queue.makeBounded<number>(100));
        Δ(queue.offerAll(Conc(1, 2, 3)));
        const resNegative = Δ(queue.takeN(-3));
        const resZero     = Δ(queue.takeN(0));
        return resNegative.assert(isEmpty) && resZero.assert(isEmpty);
      }),
    );
    test.io(
      "blocks until the required number of elements is available",
      Do((Δ) => {
        const queue   = Δ(Queue.makeBounded<number>(100));
        const updater = queue.offer(10).forever;
        const getter  = queue.takeN(5);
        const res     = Δ(getter.race(updater));
        return res.assert(hasSize(deepEqualTo(5)));
      }),
    );
  });
  test.io(
    "offerAll with takeAll",
    Do((Δ) => {
      const queue  = Δ(Queue.makeBounded<number>(10));
      const orders = Conc.range(1, 10);
      Δ(queue.offerAll(orders));
      Δ(waitForSize(queue, 10));
      const l = Δ(queue.takeAll);
      return l.assert(deepEqualTo(orders));
    }),
  );
  test.io(
    "offerAll with takeAll and back pressure",
    Do((Δ) => {
      const queue  = Δ(Queue.makeBounded<number>(2));
      const orders = Conc.range(1, 3);
      const f      = Δ(queue.offerAll(orders).fork);
      const size   = Δ(waitForSize(queue, 3));
      const c      = Δ(queue.takeAll);
      Δ(f.interrupt);
      return size.assert(strictEqualTo(3)) && c.assert(deepEqualTo(Conc(1, 2)));
    }),
  );
  test.io(
    "offerAll with takeAll and back pressure + interruption",
    Do((Δ) => {
      const queue   = Δ(Queue.makeBounded<number>(2));
      const orders1 = Conc.range(1, 2);
      const orders2 = Conc.range(3, 4);
      Δ(queue.offerAll(orders1));
      const f = Δ(queue.offerAll(orders2).fork);
      Δ(waitForSize(queue, 4));
      Δ(f.interrupt);
      const l1 = Δ(queue.takeAll);
      const l2 = Δ(queue.takeAll);
      return l1.assert(deepEqualTo(orders1)) && l2.assert(isEmpty);
    }),
  );
  test.io(
    "offerAll with takeAll and back pressure, check ordering",
    Do((Δ) => {
      const queue  = Δ(Queue.makeBounded<number>(64));
      const orders = Conc.range(1, 128);
      const f      = Δ(queue.offerAll(orders).fork);
      Δ(waitForSize(queue, 128));
      const l = Δ(queue.takeAll);
      Δ(f.interrupt);
      return l.assert(deepEqualTo(Conc.range(1, 64)));
    }),
  );
});

function waitForValue<T>(ref: UIO<T>, value: T): URIO<Live, T> {
  return Live.live((ref < Clock.sleep((10).milliseconds)).repeatUntil((v) => Equatable.deepEquals(v, value)));
}

function waitForSize<A>(queue: Queue<A>, size: number): URIO<Live, number> {
  return waitForValue(queue.size, size);
}
