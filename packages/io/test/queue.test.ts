import { deepEqualTo } from "@fncts/test/control/Assertion";

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
});

function waitForValue<T>(ref: UIO<T>, value: T): URIO<Live, T> {
  return Live.live((ref < Clock.sleep((10).milliseconds)).repeatUntil((v) => Equatable.deepEquals(v, value)));
}

function waitForSize<A>(queue: Queue<A>, size: number): URIO<Live, number> {
  return waitForValue(queue.size, size);
}
