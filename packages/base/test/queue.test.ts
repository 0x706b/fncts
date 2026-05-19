import type {} from "@fncts/base/global";
import type {} from "@fncts/io/global";

function Q<A>(...as: A[]): ImmutableQueue<A> {
  let q = ImmutableQueue.empty<A>();
  for (const a of as) {
    q = q.enqueue(a);
  }
  return q;
}

suite.concurrent("ImmutableQueue", () => {
  suite.concurrent("constructors", () => {
    test("empty", ImmutableQueue.empty<number>().assert(strictEqualTo(Q())));

    test("single", ImmutableQueue.single(1).assert(strictEqualTo(Q(1))));
  });

  suite.concurrent("isEmpty / isNonEmpty", () => {
    test("empty is empty", ImmutableQueue.empty<number>().isEmpty.assert(isTrue));
    test("empty is not non-empty", ImmutableQueue.empty<number>().isNonEmpty.assert(isFalse));
    test("non-empty is not empty", Q(1).isEmpty.assert(isFalse));
    test("non-empty is non-empty", Q(1).isNonEmpty.assert(isTrue));
  });

  suite.concurrent("length", () => {
    test("empty length", ImmutableQueue.empty<number>().length.assert(strictEqualTo(0)));
    test("single length", Q(1).length.assert(strictEqualTo(1)));
    test("multiple length", Q(1, 2, 3).length.assert(strictEqualTo(3)));
    test("length after enqueue", ImmutableQueue.empty<number>().enqueue(1).enqueue(2).length.assert(strictEqualTo(2)));
    test("length after dequeue", Q(1, 2, 3).unsafeDequeue[1].length.assert(strictEqualTo(2)));
  });

  suite.concurrent("head", () => {
    test("safe head on empty", ImmutableQueue.empty<number>().head.assert(strictEqualTo(Nothing())));
    test("safe head on single", Q(1).head.assert(strictEqualTo(Just(1))));
    test("safe head on multiple", Q(1, 2, 3).head.assert(strictEqualTo(Just(1))));
    test(
      "safe head with in buffer only",
      ImmutableQueue.empty<number>()
        .enqueue(1)
        .enqueue(2)
        .head.assert(strictEqualTo(Just(1))),
    );
  });

  suite.concurrent("unsafeHead", () => {
    test("unsafeHead returns first element", Q(1, 2, 3).unsafeHead.assert(strictEqualTo(1)));
    test("unsafeHead on empty throws", () => {
      let threw = false;
      try {
        ImmutableQueue.empty<number>().unsafeHead;
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });
  });

  suite.concurrent("tail", () => {
    test("safe tail on empty", ImmutableQueue.empty<number>().tail.assert(strictEqualTo(Nothing())));
    test("safe tail on single", Q(1).tail.assert(deepEqualTo(Just(Q()))));
    test("safe tail on multiple", Q(1, 2, 3).tail.assert(deepEqualTo(Just(Q(2, 3)))));
  });

  suite.concurrent("unsafeTail", () => {
    test("unsafeTail returns remainder", Q(1, 2, 3).unsafeTail.assert(strictEqualTo(Q(2, 3))));
    test("unsafeTail on empty throws", () => {
      let threw = false;
      try {
        ImmutableQueue.empty<number>().unsafeTail;
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });
  });

  suite.concurrent("prepend", () => {
    test(
      "prepend to empty",
      ImmutableQueue.empty<number>()
        .prepend(1)
        .assert(strictEqualTo(Q(1))),
    );
    test(
      "prepend to non-empty",
      Q(2, 3)
        .prepend(1)
        .assert(strictEqualTo(Q(1, 2, 3))),
    );
    test(
      "prepend order",
      Q(1)
        .prepend(2)
        .prepend(3)
        .assert(strictEqualTo(Q(3, 2, 1))),
    );
  });

  suite.concurrent("enqueue", () => {
    test(
      "enqueue to empty",
      ImmutableQueue.empty<number>()
        .enqueue(1)
        .assert(strictEqualTo(Q(1))),
    );
    test(
      "enqueue to non-empty",
      Q(1, 2)
        .enqueue(3)
        .assert(strictEqualTo(Q(1, 2, 3))),
    );
    test(
      "enqueue order",
      ImmutableQueue.empty<number>()
        .enqueue(1)
        .enqueue(2)
        .enqueue(3)
        .assert(strictEqualTo(Q(1, 2, 3))),
    );
  });

  suite.concurrent("dequeue", () => {
    test("safe dequeue on empty", ImmutableQueue.empty<number>().dequeue.assert(strictEqualTo(Nothing())));
    test("safe dequeue on single", Q(1).dequeue.assert(deepEqualTo(Just([1, Q()] as const))));
    test("safe dequeue on multiple", Q(1, 2, 3).dequeue.assert(deepEqualTo(Just([1, Q(2, 3)] as const))));
    test("safe dequeue triggers in reversal", () => {
      const q = ImmutableQueue.empty<number>().enqueue(1).enqueue(2);
      return q.dequeue.assert(deepEqualTo(Just([1, Q(2)] as const)));
    });
  });

  suite.concurrent("unsafeDequeue", () => {
    test(
      "unsafeDequeue returns element and remainder",
      Q(1, 2, 3).unsafeDequeue.assert(deepEqualTo([1, Q(2, 3)] as const)),
    );
    test("unsafeDequeue on empty throws", () => {
      let threw = false;
      try {
        ImmutableQueue.empty<number>().unsafeDequeue;
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });
  });

  suite.concurrent("map", () => {
    test(
      "map empty",
      ImmutableQueue.empty<number>()
        .map((n) => n + 1)
        .assert(strictEqualTo(Q())),
    );
    test(
      "map non-empty",
      Q(1, 2, 3)
        .map((n) => n + 1)
        .assert(strictEqualTo(Q(2, 3, 4))),
    );
    test(
      "map to different type",
      Q(1, 2, 3)
        .map((n) => n.toString())
        .assert(strictEqualTo(Q("1", "2", "3"))),
    );
  });

  suite.concurrent("foldLeft", () => {
    test(
      "foldLeft empty",
      ImmutableQueue.empty<number>()
        .foldLeft(0, (acc, n) => acc + n)
        .assert(strictEqualTo(0)),
    );
    test(
      "foldLeft sum",
      Q(1, 2, 3)
        .foldLeft(0, (acc, n) => acc + n)
        .assert(strictEqualTo(6)),
    );
    test(
      "foldLeft product",
      Q(1, 2, 3, 4)
        .foldLeft(1, (acc, n) => acc * n)
        .assert(strictEqualTo(24)),
    );
    test(
      "foldLeft string concat",
      Q("a", "b", "c")
        .foldLeft("", (acc, s) => acc + s)
        .assert(strictEqualTo("abc")),
    );
    test(
      "foldLeft order",
      Q(1, 2, 3)
        .foldLeft("", (acc, n) => acc + n)
        .assert(strictEqualTo("123")),
    );
  });

  suite.concurrent("some", () => {
    test(
      "some empty",
      ImmutableQueue.empty<number>()
        .some((n) => n > 0)
        .assert(isFalse),
    );
    test(
      "some match",
      Q(1, 2, 3)
        .some((n) => n === 2)
        .assert(isTrue),
    );
    test(
      "some no match",
      Q(1, 2, 3)
        .some((n) => n === 10)
        .assert(isFalse),
    );
    test(
      "some across in and out",
      Q(1, 2)
        .enqueue(3)
        .some((n) => n === 3)
        .assert(isTrue),
    );
  });

  suite.concurrent("find", () => {
    test(
      "find empty",
      ImmutableQueue.empty<number>()
        .find((n) => n > 0)
        .assert(strictEqualTo(Nothing())),
    );
    test(
      "find match",
      Q(1, 2, 3)
        .find((n) => n === 2)
        .assert(strictEqualTo(Just(2))),
    );
    test(
      "find no match",
      Q(1, 2, 3)
        .find((n) => n === 10)
        .assert(strictEqualTo(Nothing())),
    );
    test(
      "find first match",
      Q(1, 2, 3)
        .find((n) => n > 1)
        .assert(strictEqualTo(Just(2))),
    );
  });

  suite.concurrent("filter", () => {
    test(
      "filter empty",
      ImmutableQueue.empty<number>()
        .filter((n) => n > 0)
        .assert(strictEqualTo(Q())),
    );
    test(
      "filter all match",
      Q(1, 2, 3)
        .filter((n) => n > 0)
        .assert(strictEqualTo(Q(1, 2, 3))),
    );
    test(
      "filter none match",
      Q(1, 2, 3)
        .filter((n) => n > 10)
        .assert(strictEqualTo(Q())),
    );
    test(
      "filter some match",
      Q(1, 2, 3, 4, 5)
        .filter((n) => n % 2 === 0)
        .assert(strictEqualTo(Q(2, 4))),
    );
  });

  suite.concurrent("count", () => {
    test(
      "count empty",
      ImmutableQueue.empty<number>()
        .count((n) => n > 0)
        .assert(strictEqualTo(0)),
    );
    test(
      "count all match",
      Q(1, 2, 3)
        .count((n) => n > 0)
        .assert(strictEqualTo(3)),
    );
    test(
      "count none match",
      Q(1, 2, 3)
        .count((n) => n > 10)
        .assert(strictEqualTo(0)),
    );
    test(
      "count some match",
      Q(1, 2, 3, 4, 5)
        .count((n) => n % 2 === 0)
        .assert(strictEqualTo(2)),
    );
  });

  suite.concurrent("iteration", () => {
    test("iterator empty", () => {
      const result = [...ImmutableQueue.empty<number>()];
      return result.assert(deepEqualTo<Array<unknown>>([]));
    });
    test("iterator non-empty", () => {
      const result = [...Q(1, 2, 3)];
      return result.assert(deepEqualTo([1, 2, 3]));
    });
    test("iterator after enqueue", () => {
      const result = [...ImmutableQueue.empty<number>().enqueue(1).enqueue(2).enqueue(3)];
      return result.assert(deepEqualTo([1, 2, 3]));
    });
    test("iterator after dequeue", () => {
      const q      = Q(1, 2, 3).unsafeDequeue[1];
      const result = [...q];
      return result.assert(deepEqualTo([2, 3]));
    });
    test("iterator after mixed operations", () => {
      const q      = ImmutableQueue.empty<number>().enqueue(1).enqueue(2).prepend(0).enqueue(3);
      const result = [...q];
      return result.assert(deepEqualTo([0, 1, 2, 3]));
    });
    test("iterator early break", () => {
      const result: number[] = [];
      for (const n of Q(1, 2, 3, 4, 5)) {
        result.push(n);
        if (n === 3) break;
      }
      return result.assert(deepEqualTo([1, 2, 3]));
    });
  });

  suite.concurrent("equality", () => {
    test("same values equal", Q(1, 2, 3).assert(strictEqualTo(Q(1, 2, 3))));
    test("different values not equal", Q(1, 2, 3).assert(strictEqualTo(Q(1, 2, 3, 4)).invert));
    test("empty queues equal", ImmutableQueue.empty<number>().assert(strictEqualTo(ImmutableQueue.empty<number>())));
    test("single element queues equal", Q(1).assert(strictEqualTo(Q(1))));
    test("order matters", Q(1, 2).assert(strictEqualTo(Q(2, 1)).invert));
  });

  suite.concurrent("isQueue", () => {
    test("isQueue queue", ImmutableQueue.is(Q(1)).assert(isTrue));
    test("isQueue empty", ImmutableQueue.is(ImmutableQueue.empty()).assert(isTrue));
    test("isQueue not queue", ImmutableQueue.is([1, 2]).assert(isFalse));
    test("isQueue primitive", ImmutableQueue.is(1).assert(isFalse));
    test("isQueue object", ImmutableQueue.is({}).assert(isFalse));
  });

  suite.concurrent("property-based", () => {
    test.io(
      "enqueue increases length",
      Gen.int.array.check((as) => {
        let q = ImmutableQueue.empty<number>();
        for (const a of as) {
          q = q.enqueue(a);
        }
        return q.length.assert(strictEqualTo(as.length));
      }),
    );

    test.io(
      "dequeue decreases length",
      Gen.int.array.check((as) => {
        if (as.length === 0) return true.assert(isTrue);
        let q = ImmutableQueue.empty<number>();
        for (const a of as) {
          q = q.enqueue(a);
        }
        const [, rest] = q.unsafeDequeue;
        return rest.length.assert(strictEqualTo(as.length - 1));
      }),
    );

    test.io(
      "enqueue then dequeue roundtrip",
      Gen.int.array.check((as) => {
        let q = ImmutableQueue.empty<number>();
        for (const a of as) {
          q = q.enqueue(a);
        }
        const out: number[] = [];
        while (q.isNonEmpty) {
          const [head, rest] = q.unsafeDequeue;
          out.push(head);
          q = rest;
        }
        return out.assert(deepEqualTo([...as]));
      }),
    );

    test.io(
      "map identity",
      Gen.int.array.check((as) => {
        let q = ImmutableQueue.empty<number>();
        for (const a of as) {
          q = q.enqueue(a);
        }
        return q.map((x) => x).assert(strictEqualTo(q));
      }),
    );

    test.io(
      "map composition",
      Gen.int.array.check((as) => {
        let q = ImmutableQueue.empty<number>();
        for (const a of as) {
          q = q.enqueue(a);
        }
        return q
          .map((x) => x + 1)
          .map((x) => x * 2)
          .assert(strictEqualTo(q.map((x) => (x + 1) * 2)));
      }),
    );

    test.io(
      "foldLeft sum matches array",
      Gen.int.array.check((as) => {
        let q = ImmutableQueue.empty<number>();
        for (const a of as) {
          q = q.enqueue(a);
        }
        const queueSum = q.foldLeft(0, (acc, n) => acc + n);
        const arrSum   = as.foldLeft(0, (acc, n) => acc + n);
        return queueSum.assert(strictEqualTo(arrSum));
      }),
    );

    test.io(
      "filter then length <= original length",
      Gen.int.array.check((as) => {
        let q = ImmutableQueue.empty<number>();
        for (const a of as) {
          q = q.enqueue(a);
        }
        return q.filter(() => true).length.assert(strictEqualTo(q.length));
      }),
    );

    test.io(
      "prepend increases length",
      Gen.int.array.check((as) => {
        let q = ImmutableQueue.empty<number>();
        for (const a of as) {
          q = q.enqueue(a);
        }
        return q.prepend(42).length.assert(strictEqualTo(q.length + 1));
      }),
    );
  });
});
