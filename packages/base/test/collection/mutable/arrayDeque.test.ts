import type {} from "@fncts/base/global";
import type {} from "@fncts/io/global";

import { ArrayDeque } from "@fncts/base/collection/mutable/ArrayDeque";
import { isJust, isNothing } from "@fncts/test/control/Assertion";

function fromArray<A>(as: A[]): ArrayDeque<A> {
  const deque = ArrayDeque.empty<A>(Math.max(2, as.length));
  for (const a of as) {
    deque.addOne(a);
  }
  return deque;
}

suite("ArrayDeque", () => {
  suite("empty", () => {
    test("creates an empty deque", () => {
      const deque = ArrayDeque.empty<number>();
      return deque.isEmpty.assert(isTrue) && deque.length.assert(strictEqualTo(0));
    });

    test("creates with custom initial size", () => {
      const deque = ArrayDeque.empty<number>(32);
      return deque.isEmpty.assert(isTrue) && deque.length.assert(strictEqualTo(0));
    });
  });

  suite("addOne", () => {
    test("addOne to empty", () => {
      const deque = ArrayDeque.empty<number>();
      deque.addOne(1);
      return deque.toArray().assert(deepEqualTo([1]));
    });

    test("addOne multiple preserves order", () => {
      const deque = ArrayDeque.empty<number>();
      deque.addOne(1);
      deque.addOne(2);
      deque.addOne(3);
      return deque.toArray().assert(deepEqualTo([1, 2, 3]));
    });

    test("addOne returns same instance", () => {
      const deque = ArrayDeque.empty<number>();
      const ret = deque.addOne(1);
      return (ret === deque).assert(isTrue);
    });

    test("addOne grows when capacity exceeded", () => {
      const deque = ArrayDeque.empty<number>(2);
      deque.addOne(1);
      deque.addOne(2);
      deque.addOne(3);
      return deque.toArray().assert(deepEqualTo([1, 2, 3])) && deque.length.assert(strictEqualTo(3));
    });
  });

  suite("prepend", () => {
    test("prepend to empty", () => {
      const deque = ArrayDeque.empty<number>();
      deque.prepend(1);
      return deque.toArray().assert(deepEqualTo([1]));
    });

    test("prepend multiple reverses prepended order", () => {
      const deque = ArrayDeque.empty<number>();
      deque.prepend(1);
      deque.prepend(2);
      deque.prepend(3);
      return deque.toArray().assert(deepEqualTo([3, 2, 1]));
    });

    test("prepend returns same instance", () => {
      const deque = ArrayDeque.empty<number>();
      const ret = deque.prepend(1);
      return (ret === deque).assert(isTrue);
    });

    test("prepend grows when capacity exceeded", () => {
      const deque = ArrayDeque.empty<number>(2);
      deque.prepend(1);
      deque.prepend(2);
      deque.prepend(3);
      return deque.toArray().assert(deepEqualTo([3, 2, 1])) && deque.length.assert(strictEqualTo(3));
    });
  });

  suite("get", () => {
    test("get first element", () => {
      const deque = fromArray([1, 2, 3]);
      return deque.get(0).assert(strictEqualTo(1));
    });

    test("get last element", () => {
      const deque = fromArray([1, 2, 3]);
      return deque.get(2).assert(strictEqualTo(3));
    });

    test("get middle element", () => {
      const deque = fromArray([1, 2, 3]);
      return deque.get(1).assert(strictEqualTo(2));
    });

    test("get throws on negative index", () => {
      const deque = fromArray([1, 2, 3]);
      let threw = false;
      try {
        deque.get(-1);
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });

    test("get throws on index >= length", () => {
      const deque = fromArray([1, 2, 3]);
      let threw = false;
      try {
        deque.get(3);
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });

    test("get works after wrap-around", () => {
      const deque = ArrayDeque.empty<number>(4);
      deque.addOne(1);
      deque.addOne(2);
      deque.prepend(0);
      deque.prepend(-1);
      return (
        deque.get(0).assert(strictEqualTo(-1)) &&
        deque.get(1).assert(strictEqualTo(0)) &&
        deque.get(2).assert(strictEqualTo(1)) &&
        deque.get(3).assert(strictEqualTo(2))
      );
    });
  });

  suite("update", () => {
    test("update existing index", () => {
      const deque = fromArray([1, 2, 3]);
      deque.update(1, 99);
      return deque.toArray().assert(deepEqualTo([1, 99, 3]));
    });

    test("update first element", () => {
      const deque = fromArray([1, 2, 3]);
      deque.update(0, 99);
      return deque.toArray().assert(deepEqualTo([99, 2, 3]));
    });

    test("update last element", () => {
      const deque = fromArray([1, 2, 3]);
      deque.update(2, 99);
      return deque.toArray().assert(deepEqualTo([1, 2, 99]));
    });

    test("update throws on out of bounds", () => {
      const deque = fromArray([1, 2, 3]);
      let threw = false;
      try {
        deque.update(3, 99);
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });

    test("update works after wrap-around", () => {
      const deque = ArrayDeque.empty<number>(4);
      deque.addOne(1);
      deque.addOne(2);
      deque.prepend(0);
      deque.prepend(-1);
      deque.update(1, 99);
      return deque.toArray().assert(deepEqualTo([-1, 99, 1, 2]));
    });
  });

  suite("insert", () => {
    test("insert at head", () => {
      const deque = fromArray([2, 3]);
      deque.insert(0, 1);
      return deque.toArray().assert(deepEqualTo([1, 2, 3]));
    });

    test("insert at tail", () => {
      const deque = fromArray([1, 2]);
      deque.insert(2, 3);
      return deque.toArray().assert(deepEqualTo([1, 2, 3]));
    });

    test("insert in middle", () => {
      const deque = fromArray([1, 3]);
      deque.insert(1, 2);
      return deque.toArray().assert(deepEqualTo([1, 2, 3]));
    });

    test("insert grows when full", () => {
      const deque = ArrayDeque.empty<number>(2);
      deque.addOne(1);
      deque.addOne(2);
      deque.insert(1, 99);
      return deque.toArray().assert(deepEqualTo([1, 99, 2]));
    });

    test("insert shifts tail side when closer to end", () => {
      const deque = fromArray([1, 2, 3, 4, 5]);
      deque.insert(4, 99);
      return deque.toArray().assert(deepEqualTo([1, 2, 3, 4, 99, 5]));
    });

    test("insert shifts head side when closer to start", () => {
      const deque = fromArray([1, 2, 3, 4, 5]);
      deque.insert(1, 99);
      return deque.toArray().assert(deepEqualTo([1, 99, 2, 3, 4, 5]));
    });

    test("insert throws on out of bounds", () => {
      const deque = fromArray([1, 2]);
      let threw = false;
      try {
        deque.insert(4, 99);
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });

    test("insert works with wrap-around", () => {
      const deque = ArrayDeque.empty<number>(4);
      deque.addOne(1);
      deque.addOne(2);
      deque.prepend(0);
      deque.prepend(-1);
      deque.insert(2, 99);
      return deque.toArray().assert(deepEqualTo([-1, 0, 99, 1, 2]));
    });
  });

  suite("remove", () => {
    test("remove from head", () => {
      const deque = fromArray([1, 2, 3, 4, 5]);
      deque.remove(0, 2);
      return deque.toArray().assert(deepEqualTo([3, 4, 5]));
    });

    test("remove from tail", () => {
      const deque = fromArray([1, 2, 3, 4, 5]);
      deque.remove(3, 2);
      return deque.toArray().assert(deepEqualTo([1, 2, 3]));
    });

    test("remove from middle", () => {
      const deque = fromArray([1, 2, 3, 4, 5]);
      deque.remove(2, 1);
      return deque.toArray().assert(deepEqualTo([1, 2, 4, 5]));
    });

    test("remove count exceeding remaining removes rest", () => {
      const deque = fromArray([1, 2, 3]);
      deque.remove(1, 10);
      return deque.toArray().assert(deepEqualTo([1]));
    });

    test("remove count of 0 does nothing", () => {
      const deque = fromArray([1, 2, 3]);
      deque.remove(1, 0);
      return deque.toArray().assert(deepEqualTo([1, 2, 3]));
    });

    test("remove negative count throws", () => {
      const deque = fromArray([1, 2, 3]);
      let threw = false;
      try {
        deque.remove(1, -1);
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });

    test("remove throws on out of bounds for positive count", () => {
      const deque = fromArray([1, 2, 3]);
      let threw = false;
      try {
        deque.remove(5, 1);
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });

    test("remove shrinks large sparse array", () => {
      const deque = ArrayDeque.empty<number>(256);
      for (let i = 0; i < 200; i++) {
        deque.addOne(i);
      }
      deque.remove(10, 190);
      return (
        deque.toArray().assert(deepEqualTo([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])) && deque.length.assert(strictEqualTo(10))
      );
    });

    test("remove works with wrap-around", () => {
      const deque = ArrayDeque.empty<number>(4);
      deque.addOne(1);
      deque.addOne(2);
      deque.prepend(0);
      deque.prepend(-1);
      deque.remove(1, 2);
      return deque.toArray().assert(deepEqualTo([-1, 2]));
    });
  });

  suite("removeHead", () => {
    test("removeHead returns first element", () => {
      const deque = fromArray([1, 2, 3]);
      const head = deque.removeHead();
      return head.assert(strictEqualTo(1)) && deque.toArray().assert(deepEqualTo([2, 3]));
    });

    test("removeHead throws on empty", () => {
      const deque = ArrayDeque.empty<number>();
      let threw = false;
      try {
        deque.removeHead();
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });

    test("removeHead with resize reduces capacity", () => {
      const deque = ArrayDeque.empty<number>(256);
      deque.addOne(1);
      deque.addOne(2);
      const head = deque.removeHead(true);
      return (
        head.assert(strictEqualTo(1)) &&
        deque.length.assert(strictEqualTo(1)) &&
        deque.toArray().assert(deepEqualTo([2]))
      );
    });
  });

  suite("removeHeadOption", () => {
    test("removeHeadOption returns Just on non-empty", () => {
      const deque = fromArray([1, 2, 3]);
      return deque.removeHeadOption().assert(isJust(strictEqualTo(1))) && deque.toArray().assert(deepEqualTo([2, 3]));
    });

    test("removeHeadOption returns Nothing on empty", () => {
      const deque = ArrayDeque.empty<number>();
      return deque.removeHeadOption().assert(isNothing);
    });
  });

  suite("removeLastOption", () => {
    test("removeLastOption returns Just on non-empty", () => {
      const deque = fromArray([1, 2, 3]);
      return deque.removeLastOption().assert(isJust(strictEqualTo(3))) && deque.toArray().assert(deepEqualTo([1, 2]));
    });

    test("removeLastOption returns Nothing on empty", () => {
      const deque = ArrayDeque.empty<number>();
      return deque.removeLastOption().assert(isNothing);
    });

    test("removeLastOption with resize reduces capacity", () => {
      const deque = ArrayDeque.empty<number>(256);
      deque.addOne(1);
      deque.addOne(2);
      return (
        deque.removeLastOption(true).assert(isJust(strictEqualTo(2))) &&
        deque.length.assert(strictEqualTo(1)) &&
        deque.toArray().assert(deepEqualTo([1]))
      );
    });
  });

  suite("length / isEmpty", () => {
    test("empty deque has length 0 and isEmpty", () => {
      const deque = ArrayDeque.empty<number>();
      return deque.length.assert(strictEqualTo(0)) && deque.isEmpty.assert(isTrue);
    });

    test("length increases with addOne", () => {
      const deque = ArrayDeque.empty<number>();
      deque.addOne(1);
      deque.addOne(2);
      return deque.length.assert(strictEqualTo(2)) && deque.isEmpty.assert(isFalse);
    });

    test("length increases with prepend", () => {
      const deque = ArrayDeque.empty<number>();
      deque.prepend(1);
      deque.prepend(2);
      return deque.length.assert(strictEqualTo(2));
    });

    test("length decreases with removeHead", () => {
      const deque = fromArray([1, 2, 3]);
      deque.removeHead();
      return deque.length.assert(strictEqualTo(2));
    });

    test("length decreases with remove", () => {
      const deque = fromArray([1, 2, 3, 4, 5]);
      deque.remove(1, 2);
      return deque.length.assert(strictEqualTo(3));
    });
  });

  suite("copySliceToArray", () => {
    test("copies full contents linear", () => {
      const deque = fromArray([1, 2, 3]);
      const dest = new Array<number>(3);
      deque.copySliceToArray(0, dest, 0, 3);
      return dest.assert(deepEqualTo([1, 2, 3]));
    });

    test("copies partial contents", () => {
      const deque = fromArray([1, 2, 3, 4, 5]);
      const dest = new Array<number>(3);
      deque.copySliceToArray(1, dest, 0, 3);
      return dest.assert(deepEqualTo([2, 3, 4]));
    });

    test("copies with dest offset", () => {
      const deque = fromArray([1, 2, 3]);
      const dest = new Array<number>(5);
      dest.fill(0);
      deque.copySliceToArray(0, dest, 2, 3);
      return dest.assert(deepEqualTo([0, 0, 1, 2, 3]));
    });

    test("copies wrapped deque correctly", () => {
      const deque = ArrayDeque.empty<number>(4);
      deque.addOne(1);
      deque.addOne(2);
      deque.prepend(0);
      deque.prepend(-1);
      const dest = new Array<number>(4);
      deque.copySliceToArray(0, dest, 0, 4);
      return dest.assert(deepEqualTo([-1, 0, 1, 2]));
    });

    test("copySliceToArray respects maxItems", () => {
      const deque = fromArray([1, 2, 3, 4, 5]);
      const dest = new Array<number>(2);
      deque.copySliceToArray(0, dest, 0, 2);
      return dest.assert(deepEqualTo([1, 2]));
    });
  });

  suite("wrap-around behavior", () => {
    test("interleaved prepend and addOne wrap correctly", () => {
      const deque = ArrayDeque.empty<number>(4);
      deque.addOne(2);
      deque.addOne(3);
      deque.prepend(1);
      deque.prepend(0);
      return deque.toArray().assert(deepEqualTo([0, 1, 2, 3]));
    });

    test("get/update after wrap-around", () => {
      const deque = ArrayDeque.empty<number>(4);
      deque.addOne(2);
      deque.addOne(3);
      deque.prepend(1);
      deque.prepend(0);
      deque.update(2, 99);
      return (
        deque.get(0).assert(strictEqualTo(0)) &&
        deque.get(3).assert(strictEqualTo(3)) &&
        deque.toArray().assert(deepEqualTo([0, 1, 99, 3]))
      );
    });

    test("removeHead after wrap-around", () => {
      const deque = ArrayDeque.empty<number>(4);
      deque.addOne(2);
      deque.addOne(3);
      deque.prepend(1);
      deque.prepend(0);
      const head = deque.removeHead();
      return head.assert(strictEqualTo(0)) && deque.toArray().assert(deepEqualTo([1, 2, 3]));
    });

    test("removeLastOption after wrap-around", () => {
      const deque = ArrayDeque.empty<number>(4);
      deque.addOne(2);
      deque.addOne(3);
      deque.prepend(1);
      deque.prepend(0);
      const last = deque.removeLastOption();
      return last.assert(isJust(strictEqualTo(3))) && deque.toArray().assert(deepEqualTo([0, 1, 2]));
    });

    test("insert middle after wrap-around", () => {
      const deque = ArrayDeque.empty<number>(4);
      deque.addOne(2);
      deque.addOne(3);
      deque.prepend(1);
      deque.prepend(0);
      deque.insert(2, 99);
      return deque.toArray().assert(deepEqualTo([0, 1, 99, 2, 3]));
    });

    test("remove middle after wrap-around", () => {
      const deque = ArrayDeque.empty<number>(4);
      deque.addOne(2);
      deque.addOne(3);
      deque.prepend(1);
      deque.prepend(0);
      deque.remove(1, 2);
      return deque.toArray().assert(deepEqualTo([0, 3]));
    });

    test("copySliceToArray with wrap-around and partial copy", () => {
      const deque = ArrayDeque.empty<number>(4);
      deque.addOne(2);
      deque.addOne(3);
      deque.prepend(1);
      deque.prepend(0);
      const dest = new Array<number>(2);
      deque.copySliceToArray(1, dest, 0, 2);
      return dest.assert(deepEqualTo([1, 2]));
    });
  });

  suite("growth", () => {
    test("grows from small initial capacity", () => {
      const deque = ArrayDeque.empty<number>(2);
      for (let i = 0; i < 100; i++) {
        deque.addOne(i);
      }
      const expected = Array.from({ length: 100 }, (_, i) => i);
      return deque.toArray().assert(deepEqualTo(expected)) && deque.length.assert(strictEqualTo(100));
    });

    test("grows with prepend", () => {
      const deque = ArrayDeque.empty<number>(2);
      for (let i = 0; i < 100; i++) {
        deque.prepend(i);
      }
      const expected = Array.from({ length: 100 }, (_, i) => 99 - i);
      return deque.toArray().assert(deepEqualTo(expected)) && deque.length.assert(strictEqualTo(100));
    });

    test("grows with insert", () => {
      const deque = ArrayDeque.empty<number>(2);
      for (let i = 0; i < 50; i++) {
        deque.insert(0, i);
      }
      const expected = Array.from({ length: 50 }, (_, i) => 49 - i);
      return deque.toArray().assert(deepEqualTo(expected));
    });
  });

  suite("shrink", () => {
    test("shrinks after removing most elements from large deque", () => {
      const deque = ArrayDeque.empty<number>(256);
      for (let i = 0; i < 200; i++) {
        deque.addOne(i);
      }
      deque.remove(10, 190);
      return (
        deque.toArray().assert(deepEqualTo([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])) && deque.length.assert(strictEqualTo(10))
      );
    });

    test("shrinks from tail removal", () => {
      const deque = ArrayDeque.empty<number>(256);
      for (let i = 0; i < 200; i++) {
        deque.addOne(i);
      }
      deque.remove(190, 10);
      const expected = Array.from({ length: 190 }, (_, i) => i);
      return deque.toArray().assert(deepEqualTo(expected)) && deque.length.assert(strictEqualTo(190));
    });
  });

  suite("property-based", () => {
    test.io(
      "addOne preserves order",
      Gen.int.array.check((as) => {
        const deque = ArrayDeque.empty<number>();
        for (const a of as) {
          deque.addOne(a);
        }
        return deque.toArray().assert(deepEqualTo([...as]));
      }),
    );

    test.io(
      "prepend then reverse equals addOne",
      Gen.int.array.check((as) => {
        const deque = ArrayDeque.empty<number>();
        for (const a of as) {
          deque.prepend(a);
        }
        return deque.toArray().assert(deepEqualTo([...as].reverse()));
      }),
    );

    test.io(
      "removeHead decreases length",
      Gen.int.array.check((as) => {
        if (as.length === 0) return true.assert(isTrue);
        const deque = ArrayDeque.empty<number>();
        for (const a of as) {
          deque.addOne(a);
        }
        deque.removeHead();
        return deque.length.assert(strictEqualTo(as.length - 1));
      }),
    );

    test.io(
      "get after insert matches expected",
      Gen.int.conc.zip(Gen.int).check(([as, n]) => {
        const deque = ArrayDeque.empty<number>();
        const arr: number[] = [];
        for (const a of as) {
          deque.addOne(a);
          arr.push(a);
        }
        const idx = arr.length === 0 ? 0 : Math.abs(n) % (arr.length + 1);
        arr.splice(idx, 0, 42);
        deque.insert(idx, 42);
        return deque.toArray().assert(deepEqualTo(arr));
      }),
    );

    test.io(
      "remove then insert roundtrip",
      Gen.int.conc.check((as) => {
        if (as.length < 2) return true.assert(isTrue);
        const deque = ArrayDeque.empty<number>();
        const arr: number[] = [];
        for (const a of as) {
          deque.addOne(a);
          arr.push(a);
        }
        const idx = 0;
        const count = 1;
        arr.splice(idx, count);
        deque.remove(idx, count);
        arr.splice(idx, 0, 99);
        deque.insert(idx, 99);
        return deque.toArray().assert(deepEqualTo(arr));
      }),
    );
  });
});
