import { ListBuffer } from "@fncts/base/collection/mutable/ListBuffer";

function buffer<A>(...as: A[]): ListBuffer<A> {
  const b = new ListBuffer<A>();
  for (const a of as) {
    b.append(a);
  }
  return b;
}

suite.concurrent("ListBuffer", () => {
  suite.concurrent("empty", () => {
    test("empty buffer has length 0", () => {
      const b = new ListBuffer<number>();
      return b.length.assert(strictEqualTo(0));
    });

    test("empty buffer isEmpty is true", () => {
      const b = new ListBuffer<number>();
      return b.isEmpty.assert(isTrue);
    });

    test("empty buffer toList is Nil", () => {
      const b = new ListBuffer<number>();
      return b.toList.assert(strictEqualTo(Nil()));
    });

    test("empty buffer iteration yields nothing", () => {
      const b             = new ListBuffer<number>();
      const acc: number[] = [];
      for (const a of b) {
        acc.push(a);
      }
      return acc.assert(deepEqualTo([]));
    });
  });

  suite.concurrent("append", () => {
    test("append to empty", () => {
      const b = new ListBuffer<number>();
      b.append(1);
      return b.toList.assert(strictEqualTo(List(1)));
    });

    test("append multiple preserves order", () => {
      const b = new ListBuffer<number>();
      b.append(1);
      b.append(2);
      b.append(3);
      return b.toList.assert(strictEqualTo(List(1, 2, 3)));
    });

    test("append returns same instance", () => {
      const b   = new ListBuffer<number>();
      const ret = b.append(1);
      return (ret === b).assert(isTrue);
    });

    test("append increases length", () => {
      const b = new ListBuffer<number>();
      b.append(1);
      b.append(2);
      return b.length.assert(strictEqualTo(2));
    });

    test("append isEmpty becomes false", () => {
      const b = new ListBuffer<number>();
      b.append(1);
      return b.isEmpty.assert(isFalse);
    });
  });

  suite.concurrent("prepend", () => {
    test("prepend to empty", () => {
      const b = new ListBuffer<number>();
      b.prepend(1);
      return b.toList.assert(strictEqualTo(List(1)));
    });

    test("prepend multiple builds reverse order", () => {
      const b = new ListBuffer<number>();
      b.prepend(1);
      b.prepend(2);
      b.prepend(3);
      return b.toList.assert(strictEqualTo(List(3, 2, 1)));
    });

    test("prepend returns same instance", () => {
      const b   = new ListBuffer<number>();
      const ret = b.prepend(1);
      return (ret === b).assert(isTrue);
    });

    test("prepend increases length", () => {
      const b = new ListBuffer<number>();
      b.prepend(1);
      b.prepend(2);
      return b.length.assert(strictEqualTo(2));
    });
  });

  suite.concurrent("length / isEmpty", () => {
    test("empty", () => {
      const b = new ListBuffer<number>();
      return b.length.assert(strictEqualTo(0)) && b.isEmpty.assert(isTrue);
    });

    test("after append", () => {
      const b = buffer(1, 2, 3);
      return b.length.assert(strictEqualTo(3)) && b.isEmpty.assert(isFalse);
    });

    test("after prepend", () => {
      const b = new ListBuffer<number>();
      b.prepend(1);
      b.prepend(2);
      return b.length.assert(strictEqualTo(2));
    });

    test("after unprepend", () => {
      const b = buffer(1, 2, 3);
      b.unprepend();
      return b.length.assert(strictEqualTo(2));
    });

    test("after insert", () => {
      const b = buffer(1, 2);
      b.insert(1, 99);
      return b.length.assert(strictEqualTo(3));
    });
  });

  suite.concurrent("unsafeHead", () => {
    test("unsafeHead returns first element", () => {
      const b = buffer(1, 2, 3);
      return b.unsafeHead.assert(strictEqualTo(1));
    });

    test("unsafeHead on empty throws", () => {
      const b   = new ListBuffer<number>();
      let threw = false;
      try {
        b.unsafeHead;
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });
  });

  suite.concurrent("unsafeTail", () => {
    test("unsafeTail returns remainder", () => {
      const b = buffer(1, 2, 3);
      return b.unsafeTail.assert(strictEqualTo(List(2, 3)));
    });

    test("unsafeTail on empty throws", () => {
      const b   = new ListBuffer<number>();
      let threw = false;
      try {
        b.unsafeTail;
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });

    test("unsafeTail on single element is Nil", () => {
      const b = buffer(1);
      return b.unsafeTail.assert(strictEqualTo(Nil()));
    });
  });

  suite.concurrent("unprepend", () => {
    test("unprepend returns head", () => {
      const b = buffer(1, 2, 3);
      return b.unprepend().assert(strictEqualTo(1));
    });

    test("unprepend removes head", () => {
      const b = buffer(1, 2, 3);
      b.unprepend();
      return b.toList.assert(strictEqualTo(List(2, 3)));
    });

    test("unprepend on empty throws", () => {
      const b   = new ListBuffer<number>();
      let threw = false;
      try {
        b.unprepend();
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });

    test("unprepend single empties buffer", () => {
      const b = buffer(1);
      b.unprepend();
      return b.isEmpty.assert(isTrue) && b.toList.assert(strictEqualTo(Nil()));
    });
  });

  suite.concurrent("toList", () => {
    test("toList on empty", () => {
      const b = new ListBuffer<number>();
      return b.toList.assert(strictEqualTo(Nil()));
    });

    test("toList on non-empty", () => {
      const b = buffer(1, 2, 3);
      return b.toList.assert(strictEqualTo(List(1, 2, 3)));
    });

    test("toList returns same structure on repeated calls", () => {
      const b = buffer(1, 2, 3);
      return b.toList.assert(strictEqualTo(b.toList));
    });
  });

  suite.concurrent("insert", () => {
    test("insert at head", () => {
      const b = buffer(2, 3);
      b.insert(0, 1);
      return b.toList.assert(strictEqualTo(List(1, 2, 3)));
    });

    test("insert at tail", () => {
      const b = buffer(1, 2);
      b.insert(2, 3);
      return b.toList.assert(strictEqualTo(List(1, 2, 3)));
    });

    test("insert in middle", () => {
      const b = buffer(1, 3);
      b.insert(1, 2);
      return b.toList.assert(strictEqualTo(List(1, 2, 3)));
    });

    test("insert at 0 in empty is same as append", () => {
      const b = new ListBuffer<number>();
      b.insert(0, 1);
      return b.toList.assert(strictEqualTo(List(1)));
    });

    test("insert throws on negative index", () => {
      const b   = buffer(1, 2);
      let threw = false;
      try {
        b.insert(-1, 99);
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });

    test("insert throws on index > length", () => {
      const b   = buffer(1, 2);
      let threw = false;
      try {
        b.insert(3, 99);
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });

    test("insert returns same instance", () => {
      const b   = buffer(1, 2);
      const ret = b.insert(1, 99);
      return (ret === b).assert(isTrue);
    });

    test("insert multiple maintains order", () => {
      const b = buffer(1, 4);
      b.insert(1, 2);
      b.insert(2, 3);
      return b.toList.assert(strictEqualTo(List(1, 2, 3, 4)));
    });
  });

  suite.concurrent("foldLeft", () => {
    test("foldLeft empty", () => {
      const b = new ListBuffer<number>();
      return b.foldLeft(0, (acc, n) => acc + n).assert(strictEqualTo(0));
    });

    test("foldLeft sum", () => {
      const b = buffer(1, 2, 3);
      return b.foldLeft(0, (acc, n) => acc + n).assert(strictEqualTo(6));
    });

    test("foldLeft product", () => {
      const b = buffer(1, 2, 3, 4);
      return b.foldLeft(1, (acc, n) => acc * n).assert(strictEqualTo(24));
    });

    test("foldLeft string concat", () => {
      const b = buffer("a", "b", "c");
      return b.foldLeft("", (acc, s) => acc + s).assert(strictEqualTo("abc"));
    });
  });

  suite.concurrent("iteration", () => {
    test("iterator empty", () => {
      const b      = new ListBuffer<number>();
      const result = [...b];
      return result.assert(deepEqualTo([]));
    });

    test("iterator non-empty", () => {
      const b      = buffer(1, 2, 3);
      const result = [...b];
      return result.assert(deepEqualTo([1, 2, 3]));
    });

    test("iterator early break", () => {
      const b                = buffer(1, 2, 3, 4, 5);
      const result: number[] = [];
      for (const n of b) {
        result.push(n);
        if (n === 3) break;
      }
      return result.assert(deepEqualTo([1, 2, 3]));
    });

    test("iterator matches toList", () => {
      const b          = buffer(1, 2, 3);
      const iterResult = [...b];
      const listResult = [...b.toList];
      return iterResult.assert(deepEqualTo(listResult));
    });
  });

  suite.concurrent("mixed operations", () => {
    test("append then prepend", () => {
      const b = new ListBuffer<number>();
      b.append(2);
      b.append(3);
      b.prepend(1);
      return b.toList.assert(strictEqualTo(List(1, 2, 3)));
    });

    test("prepend then append", () => {
      const b = new ListBuffer<number>();
      b.prepend(2);
      b.prepend(1);
      b.append(3);
      return b.toList.assert(strictEqualTo(List(1, 2, 3)));
    });

    test("append then insert then unprepend", () => {
      const b = new ListBuffer<number>();
      b.append(1);
      b.append(3);
      b.insert(1, 2);
      const head = b.unprepend();
      return head.assert(strictEqualTo(1)) && b.toList.assert(strictEqualTo(List(2, 3)));
    });

    test("complex sequence", () => {
      const b = new ListBuffer<number>();
      b.append(1);
      b.append(2);
      b.prepend(0);
      b.insert(2, 99);
      b.unprepend();
      return b.toList.assert(strictEqualTo(List(1, 99, 2)));
    });
  });

  suite.concurrent("property-based", () => {
    test.io(
      "append preserves order",
      Gen.int.array.check((as) => {
        const b = new ListBuffer<number>();
        for (const a of as) {
          b.append(a);
        }
        return b.toList.assert(strictEqualTo(List.from(as)));
      }),
    );

    test.io(
      "prepend then reverse equals append",
      Gen.int.array.check((as) => {
        const b = new ListBuffer<number>();
        for (const a of as) {
          b.prepend(a);
        }
        return b.toList.reverse.assert(strictEqualTo(List.from(as)));
      }),
    );

    test.io(
      "length matches appended count",
      Gen.int.array.check((as) => {
        const b = new ListBuffer<number>();
        for (const a of as) {
          b.append(a);
        }
        return b.length.assert(strictEqualTo(as.length));
      }),
    );

    test.io(
      "unprepend reduces length by 1",
      Gen.int.array.check((as) => {
        if (as.length === 0) return true.assert(isTrue);
        const b = new ListBuffer<number>();
        for (const a of as) {
          b.append(a);
        }
        b.unprepend();
        return b.length.assert(strictEqualTo(as.length - 1));
      }),
    );

    test.io(
      "insert at random index then toList matches",
      Gen.int.array.zip(Gen.int).check(([as, n]) => {
        const b             = new ListBuffer<number>();
        const arr: number[] = [];
        for (const a of as) {
          b.append(a);
          arr.push(a);
        }
        const idx = arr.length === 0 ? 0 : Math.abs(n) % (arr.length + 1);
        arr.splice(idx, 0, 42);
        b.insert(idx, 42);
        return b.toList.assert(strictEqualTo(List.from(arr)));
      }),
    );

    test.io(
      "foldLeft sum matches array",
      Gen.int.array.check((as) => {
        const b = new ListBuffer<number>();
        for (const a of as) {
          b.append(a);
        }
        const bufferSum = b.foldLeft(0, (acc, n) => acc + n);
        const arrSum    = as.reduce((acc, n) => acc + n, 0);
        return bufferSum.assert(strictEqualTo(arrSum));
      }),
    );
  });
});
