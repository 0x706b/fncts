import type {} from "@fncts/base/global";
import type {} from "@fncts/io/global";

import { HashSet } from "@fncts/base/collection/mutable/HashSet";
import { HashEq } from "@fncts/base/data/HashEq";

suite("MutableHashSet", () => {
  suite("empty", () => {
    test("creates an empty set", () => {
      const set = HashSet.empty<number>();
      return set.size.assert(strictEqualTo(0));
    });

    test("empty set has no elements", () => {
      const set = HashSet.empty<number>();
      return set.has(0).assert(isFalse);
    });
  });

  suite("size", () => {
    test("size increases on add", () => {
      const set = HashSet.empty<number>();
      set.add(0);
      return set.size.assert(strictEqualTo(1));
    });

    test("size unchanged on duplicate add", () => {
      const set = HashSet.empty<number>();
      set.add(0);
      set.add(0);
      return set.size.assert(strictEqualTo(1));
    });

    test("size decreases on remove", () => {
      const set = HashSet.empty<number>();
      set.add(0);
      set.remove(0);
      return set.size.assert(strictEqualTo(0));
    });

    test("size after multiple operations", () => {
      const set = HashSet.empty<number>();
      set.add(0);
      set.add(1);
      set.add(2);
      set.remove(1);
      return set.size.assert(strictEqualTo(2));
    });
  });

  suite("has", () => {
    test("returns false for missing element", () => {
      const set = HashSet.empty<number>();
      set.add(0);
      return set.has(1).assert(isFalse);
    });

    test("returns true for existing element", () => {
      const set = HashSet.empty<number>();
      set.add(0);
      return set.has(0).assert(isTrue);
    });

    test("returns false after remove", () => {
      const set = HashSet.empty<number>();
      set.add(0);
      set.remove(0);
      return set.has(0).assert(isFalse);
    });
  });

  suite("add", () => {
    test("returns true for new element", () => {
      const set   = HashSet.empty<number>();
      const added = set.add(0);
      return added.assert(isTrue) && set.has(0).assert(isTrue);
    });

    test("returns false for duplicate element", () => {
      const set = HashSet.empty<number>();
      set.add(0);
      const added = set.add(0);
      return added.assert(isFalse) && set.size.assert(strictEqualTo(1));
    });

    test("multiple adds", () => {
      const set = HashSet.empty<number>();
      set.add(0);
      set.add(1);
      set.add(2);
      return (
        set.has(0).assert(isTrue) &&
        set.has(1).assert(isTrue) &&
        set.has(2).assert(isTrue) &&
        set.size.assert(strictEqualTo(3))
      );
    });
  });

  suite("remove", () => {
    test("returns true for existing element and removes it", () => {
      const set = HashSet.empty<number>();
      set.add(0);
      const removed = set.remove(0);
      return removed.assert(isTrue) && set.has(0).assert(isFalse) && set.size.assert(strictEqualTo(0));
    });

    test("returns false for missing element", () => {
      const set     = HashSet.empty<number>();
      const removed = set.remove(0);
      return removed.assert(isFalse);
    });

    test("removing from populated set", () => {
      const set = HashSet.empty<number>();
      set.add(0);
      set.add(1);
      set.add(2);
      set.remove(1);
      return set.has(1).assert(isFalse) && set.size.assert(strictEqualTo(2));
    });

    test("removing head of collision chain", () => {
      const config = HashEq({
        hash: () => 0,
        equals: (y: string) => (x: string) => x === y,
      });
      const set = HashSet.empty<string>(config);
      set.add("a");
      set.add("b");
      set.remove("a");
      return set.has("a").assert(isFalse) && set.has("b").assert(isTrue) && set.size.assert(strictEqualTo(1));
    });

    test("removing middle of collision chain", () => {
      const config = HashEq({
        hash: () => 0,
        equals: (y: string) => (x: string) => x === y,
      });
      const set = HashSet.empty<string>(config);
      set.add("a");
      set.add("b");
      set.add("c");
      set.remove("b");
      return (
        set.has("a").assert(isTrue) &&
        set.has("b").assert(isFalse) &&
        set.has("c").assert(isTrue) &&
        set.size.assert(strictEqualTo(2))
      );
    });

    test("removing tail of collision chain", () => {
      const config = HashEq({
        hash: () => 0,
        equals: (y: string) => (x: string) => x === y,
      });
      const set = HashSet.empty<string>(config);
      set.add("a");
      set.add("b");
      set.remove("b");
      return set.has("a").assert(isTrue) && set.has("b").assert(isFalse) && set.size.assert(strictEqualTo(1));
    });
  });

  suite("forEach", () => {
    test("visits all elements", () => {
      const set                    = HashSet.empty<number>();
      const visited: Array<number> = [];
      set.add(0);
      set.add(1);
      set.forEach((v) => visited.push(v));
      return visited.sort().assert(deepEqualTo([0, 1]));
    });

    test("does not call callback on empty set", () => {
      const set  = HashSet.empty<number>();
      let called = 0;
      set.forEach(() => called++);
      return called.assert(strictEqualTo(0));
    });
  });

  suite("iteration", () => {
    test("yields all elements via for...of", () => {
      const set = HashSet.empty<number>();
      set.add(0);
      set.add(1);
      const elements: Array<number> = [];
      for (const elem of set) {
        elements.push(elem);
      }
      return elements.sort().assert(deepEqualTo([0, 1]));
    });

    test("iterator on empty set returns done immediately", () => {
      const set      = HashSet.empty<number>();
      const iterator = set[Symbol.iterator]();
      const first    = iterator.next();
      return first.done!.assert(isTrue);
    });
  });

  suite("collision handling", () => {
    test("stores multiple elements with same hash", () => {
      const config = HashEq({
        hash: () => 0,
        equals: (y: string) => (x: string) => x === y,
      });
      const set = HashSet.empty<string>(config);
      set.add("a");
      set.add("b");
      set.add("c");
      return (
        set.size.assert(strictEqualTo(3)) &&
        set.has("a").assert(isTrue) &&
        set.has("b").assert(isTrue) &&
        set.has("c").assert(isTrue)
      );
    });

    test("does not add duplicate in collision chain", () => {
      const config = HashEq({
        hash: () => 0,
        equals: (y: string) => (x: string) => x === y,
      });
      const set = HashSet.empty<string>(config);
      set.add("a");
      const added = set.add("a");
      return added.assert(isFalse) && set.size.assert(strictEqualTo(1));
    });

    test("collision chain survives table growth", () => {
      const config = HashEq({
        hash: () => 0,
        equals: (y: string) => (x: string) => x === y,
      });
      const set = HashSet.empty<string>(config);
      for (let i = 0; i < 32; i++) {
        set.add(`elem-${i}`);
      }
      return (
        set.size.assert(strictEqualTo(32)) &&
        set.has("elem-0").assert(isTrue) &&
        set.has("elem-15").assert(isTrue) &&
        set.has("elem-31").assert(isTrue)
      );
    });

    test("removal from collision chain after growth", () => {
      const config = HashEq({
        hash: () => 0,
        equals: (y: string) => (x: string) => x === y,
      });
      const set = HashSet.empty<string>(config);
      for (let i = 0; i < 32; i++) {
        set.add(`elem-${i}`);
      }
      set.remove("elem-15");
      return (
        set.has("elem-15").assert(isFalse) &&
        set.has("elem-14").assert(isTrue) &&
        set.has("elem-16").assert(isTrue) &&
        set.size.assert(strictEqualTo(31))
      );
    });
  });

  suite("table growth", () => {
    test("grows table when threshold exceeded", () => {
      const set = HashSet.empty<number>();
      for (let i = 0; i < 20; i++) {
        set.add(i);
      }
      return set.size.assert(strictEqualTo(20)) && set.has(15).assert(isTrue);
    });

    test("entries remain accessible after multiple growths", () => {
      const set = HashSet.empty<number>();
      for (let i = 0; i < 1000; i++) {
        set.add(i);
      }
      let allCorrect = true;
      for (let i = 0; i < 1000; i++) {
        if (!set.has(i)) {
          allCorrect = false;
          break;
        }
      }
      return allCorrect.assert(isTrue) && set.size.assert(strictEqualTo(1000));
    });

    test("entries remain iterable after multiple growths", () => {
      const set = HashSet.empty<number>();
      for (let i = 0; i < 1000; i++) {
        set.add(i);
      }
      const found = new Set<number>();
      for (const elem of set) {
        found.add(elem);
      }
      let allExpectedFound = true;
      for (let i = 0; i < 1000; i++) {
        if (!found.has(i)) {
          allExpectedFound = false;
          break;
        }
      }
      return found.size.assert(strictEqualTo(1000)) && allExpectedFound.assert(isTrue);
    });

    test("deletion works after growth", () => {
      const set = HashSet.empty<number>();
      for (let i = 0; i < 100; i++) {
        set.add(i);
      }
      for (let i = 0; i < 50; i++) {
        set.remove(i);
      }
      return set.size.assert(strictEqualTo(50));
    });
  });

  suite("custom HashEq", () => {
    test("custom equality determines element match", () => {
      const config = HashEq({
        hash: (s: string) => s.length,
        equals: (y: string) => (x: string) => x.toLowerCase() === y.toLowerCase(),
      });
      const set = HashSet.empty<string>(config);
      set.add("Hello");
      return set.has("hello").assert(isTrue) && set.has("HELLO").assert(isTrue);
    });

    test("custom hash affects bucketing", () => {
      const config = HashEq({
        hash: (s: string) => s.charCodeAt(0),
        equals: (y: string) => (x: string) => x === y,
      });
      const set = HashSet.empty<string>(config);
      set.add("a");
      set.add("b");
      set.add("c");
      return set.size.assert(strictEqualTo(3)) && set.has("a").assert(isTrue) && set.has("b").assert(isTrue) && set.has("c").assert(isTrue);
    });
  });

  suite("mutation in place", () => {
    test("same instance is mutated by add", () => {
      const set = HashSet.empty<number>();
      set.add(0);
      return set.has(0).assert(isTrue) && set.size.assert(strictEqualTo(1));
    });

    test("same instance is mutated by remove", () => {
      const set = HashSet.empty<number>();
      set.add(0);
      set.remove(0);
      return set.has(0).assert(isFalse) && set.size.assert(strictEqualTo(0));
    });
  });
});
