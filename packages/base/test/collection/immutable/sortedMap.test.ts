import { backward, forward } from "@fncts/base/collection/immutable/SortedMap";
import { isJust, isNothing } from "@fncts/test/control/Assertion";

suite("SortedMap", () => {
  function fromNumbers<V>(...entries: ReadonlyArray<readonly [number, V]>): SortedMap<number, V> {
    let m = SortedMap.make<number, V>(Number.Ord);
    for (const [k, v] of entries) {
      m = m.set(k, v);
    }
    return m;
  }

  suite("make", () => {
    test("empty", () => {
      const map = SortedMap.make<number, string>(Number.Ord);
      return map.isEmpty.assert(isTrue) && map.size.assert(strictEqualTo(0));
    });
  });

  suite("isEmpty / isNonEmpty", () => {
    test("empty", () => {
      const map = SortedMap.make<number, string>(Number.Ord);
      return map.isEmpty.assert(isTrue) && map.isNonEmpty.assert(isFalse);
    });

    test("nonEmpty", () => {
      const map = fromNumbers([1, "a"]);
      return map.isEmpty.assert(isFalse) && map.isNonEmpty.assert(isTrue);
    });
  });

  suite("set", () => {
    test("single", () => {
      const map = fromNumbers([1, "a"]);
      return map.get(1).assert(isJust(strictEqualTo("a")));
    });

    test("multiple in order", () => {
      const map = fromNumbers([1, "a"], [2, "b"], [3, "c"]);
      return (
        map.get(1).assert(isJust(strictEqualTo("a"))) &&
        map.get(2).assert(isJust(strictEqualTo("b"))) &&
        map.get(3).assert(isJust(strictEqualTo("c")))
      );
    });

    test("multiple out of order", () => {
      const map = fromNumbers([3, "c"], [1, "a"], [2, "b"]);
      return Array.from(map).assert(
        deepEqualTo([
          [1, "a"],
          [2, "b"],
          [3, "c"],
        ]),
      );
    });

    test("duplicate keys allowed", () => {
      const map = fromNumbers([1, "a"], [1, "b"]);
      return map.size.assert(strictEqualTo(2));
    });

    test("preserves original", () => {
      const original = fromNumbers([1, "a"]);
      const updated  = original.set(2, "b");
      return original.get(2).assert(isNothing) && updated.get(2).assert(isJust(strictEqualTo("b")));
    });
  });

  suite("get", () => {
    test("existing", () => {
      const map = fromNumbers([1, "a"], [2, "b"]);
      return map.get(1).assert(isJust(strictEqualTo("a")));
    });

    test("missing", () => {
      const map = fromNumbers([1, "a"]);
      return map.get(99).assert(isNothing);
    });

    test("empty", () => {
      const map = SortedMap.make<number, string>(Number.Ord);
      return map.get(1).assert(isNothing);
    });
  });

  suite("setWith", () => {
    test("combines on duplicate", () => {
      const map = fromNumbers([1, "a"]).setWith(1, "b", String.Semigroup);
      return map.get(1).assert(isJust(strictEqualTo("ab"))) && map.size.assert(strictEqualTo(1));
    });

    test("inserts when missing", () => {
      const map = fromNumbers([1, "a"]).setWith(2, "b", String.Semigroup);
      return map.get(2).assert(isJust(strictEqualTo("b"))) && map.size.assert(strictEqualTo(2));
    });
  });

  suite("remove", () => {
    test("leaf node", () => {
      const map     = fromNumbers([1, "a"], [2, "b"]);
      const removed = map.remove(2);
      return (
        removed.get(2).assert(isNothing) &&
        removed.size.assert(strictEqualTo(1)) &&
        removed.get(1).assert(isJust(strictEqualTo("a")))
      );
    });

    test("internal node with two children", () => {
      const map     = fromNumbers([2, "b"], [1, "a"], [3, "c"]);
      const removed = map.remove(2);
      return (
        removed.get(2).assert(isNothing) &&
        removed.size.assert(strictEqualTo(2)) &&
        removed.get(1).assert(isJust(strictEqualTo("a"))) &&
        removed.get(3).assert(isJust(strictEqualTo("c")))
      );
    });

    test("root only", () => {
      const map     = fromNumbers([1, "a"]);
      const removed = map.remove(1);
      return removed.isEmpty.assert(isTrue);
    });

    test("missing key is no-op", () => {
      const map     = fromNumbers([1, "a"]);
      const removed = map.remove(99);
      return removed.size.assert(strictEqualTo(1)) && map.get(1).assert(isJust(strictEqualTo("a")));
    });

    test("preserves original", () => {
      const original = fromNumbers([1, "a"], [2, "b"]);
      const removed  = original.remove(2);
      return original.get(2).assert(isJust(strictEqualTo("b"))) && removed.get(2).assert(isNothing);
    });

    test("all nodes then empty", () => {
      let map = fromNumbers([2, "b"], [1, "a"], [3, "c"]);
      map     = map.remove(1).remove(2).remove(3);
      return map.isEmpty.assert(isTrue);
    });
  });

  suite("getGt", () => {
    test("finds greater", () => {
      const map = fromNumbers([1, "a"], [3, "c"], [5, "e"]);
      return map.getGt(2).assert(isJust(strictEqualTo("c")));
    });

    test("no greater", () => {
      const map = fromNumbers([1, "a"], [2, "b"]);
      return map.getGt(2).assert(isNothing);
    });
  });

  suite("getLt", () => {
    test("finds less", () => {
      const map = fromNumbers([1, "a"], [3, "c"], [5, "e"]);
      return map.getLt(4).assert(isJust(strictEqualTo("c")));
    });

    test("no less", () => {
      const map = fromNumbers([2, "b"], [3, "c"]);
      return map.getLt(2).assert(isNothing);
    });
  });

  suite("getGte", () => {
    test("exact match", () => {
      const map = fromNumbers([1, "a"], [3, "c"]);
      return map.getGte(3).assert(isJust(strictEqualTo("c")));
    });

    test("next greater", () => {
      const map = fromNumbers([1, "a"], [5, "e"]);
      return map.getGte(2).assert(isJust(strictEqualTo("e")));
    });
  });

  suite("getLte", () => {
    test("exact match", () => {
      const map = fromNumbers([1, "a"], [3, "c"]);
      return map.getLte(1).assert(isJust(strictEqualTo("a")));
    });

    test("next less", () => {
      const map = fromNumbers([1, "a"], [5, "e"]);
      return map.getLte(4).assert(isJust(strictEqualTo("a")));
    });
  });

  suite("size", () => {
    test("grows with set", () => {
      let map  = SortedMap.make<number, string>(Number.Ord);
      map      = map.set(1, "a");
      const s1 = map.size;
      map      = map.set(2, "b");
      return s1.assert(strictEqualTo(1)) && map.size.assert(strictEqualTo(2));
    });

    test("shrinks with remove", () => {
      const map = fromNumbers([1, "a"], [2, "b"]);
      return map.remove(1).size.assert(strictEqualTo(1));
    });
  });

  suite("iteration", () => {
    test("default ascending", () => {
      const map = fromNumbers([3, "c"], [1, "a"], [2, "b"]);
      return Array.from(map).assert(
        deepEqualTo([
          [1, "a"],
          [2, "b"],
          [3, "c"],
        ]),
      );
    });

    test("forward", () => {
      const map = fromNumbers([3, "c"], [1, "a"], [2, "b"]);
      return Array.from(forward(map)).assert(
        deepEqualTo([
          [1, "a"],
          [2, "b"],
          [3, "c"],
        ]),
      );
    });

    test("backward", () => {
      const map = fromNumbers([3, "c"], [1, "a"], [2, "b"]);
      return Array.from(backward(map)).assert(
        deepEqualTo([
          [3, "c"],
          [2, "b"],
          [1, "a"],
        ]),
      );
    });
  });

  suite("iterator", () => {
    test("next yields entries", () => {
      const map  = fromNumbers([1, "a"], [2, "b"]);
      const iter = map[Symbol.iterator]();
      return (
        iter.next().value!.assert(deepEqualTo([1, "a"] as const)) &&
        iter.next().value!.assert(deepEqualTo([2, "b"] as const)) &&
        (iter.next().done === true).assert(isTrue)
      );
    });

    test("clone preserves position", () => {
      const map  = fromNumbers([1, "a"], [2, "b"], [3, "c"]);
      const iter = map[Symbol.iterator]();
      iter.next();
      const cloned = iter.clone();
      return (
        iter.next().value!.assert(deepEqualTo([2, "b"] as const)) &&
        cloned.next().value!.assert(deepEqualTo([2, "b"] as const))
      );
    });

    test("reverse flips direction", () => {
      const map  = fromNumbers([1, "a"], [2, "b"], [3, "c"]);
      const iter = forward(map)[Symbol.iterator]();
      iter.next();
      const reversed = iter.reverse();
      return reversed.next().value!.assert(deepEqualTo([2, "b"] as const));
    });

    test("hasNext / hasPrev", () => {
      const map  = fromNumbers([1, "a"], [2, "b"]);
      const iter = map[Symbol.iterator]();
      return iter.hasNext.assert(isTrue) && iter.hasPrev.assert(isFalse);
    });

    test("remove from iterator", () => {
      const map  = fromNumbers([1, "a"], [2, "b"], [3, "c"]);
      const iter = map[Symbol.iterator]();
      iter.next();
      const removed = iter.remove();
      return (
        removed.size.assert(strictEqualTo(2)) &&
        removed.get(1).assert(isJust(strictEqualTo("a"))) &&
        removed.get(2).assert(isNothing)
      );
    });

    test("key / value / entry", () => {
      const map  = fromNumbers([1, "a"]);
      const iter = map[Symbol.iterator]();
      return (
        iter.key.assert(isJust(strictEqualTo(1))) &&
        iter.value.assert(isJust(strictEqualTo("a"))) &&
        iter.entry.assert(isJust(deepEqualTo([1, "a"] as const)))
      );
    });

    test("empty iterator", () => {
      const map  = SortedMap.make<number, string>(Number.Ord);
      const iter = map[Symbol.iterator]();
      return iter.isEmpty.assert(isTrue) && (iter.next().done === true).assert(isTrue);
    });
  });

  suite("find", () => {
    test("finds key and iterates from there forward", () => {
      const map   = fromNumbers([1, "a"], [2, "b"], [3, "c"]);
      const found = map.find(2);
      return Array.from(found).assert(
        deepEqualTo([
          [2, "b"],
          [3, "c"],
        ]),
      );
    });

    test("find missing returns empty", () => {
      const map   = fromNumbers([1, "a"]);
      const found = map.find(99);
      return Array.from(found).assert(deepEqualTo([]));
    });
  });

  suite("forEach", () => {
    test("visits all in order", () => {
      const map                   = fromNumbers([3, "c"], [1, "a"], [2, "b"]);
      const result: Array<string> = [];
      map.forEach((_, v) => {
        result.push(v);
      });
      return result.assert(deepEqualTo(["a", "b", "c"]));
    });

    test("forEachBetween", () => {
      const map                   = fromNumbers([1, "a"], [2, "b"], [3, "c"], [4, "d"]);
      const result: Array<string> = [];
      map.forEachBetween(2, 3, (_, v) => {
        result.push(v);
      });
      return result.assert(deepEqualTo(["b"]));
    });

    test("forEachLt", () => {
      const map                   = fromNumbers([1, "a"], [2, "b"], [3, "c"]);
      const result: Array<string> = [];
      map.forEachLt(3, (_, v) => {
        result.push(v);
      });
      return result.assert(deepEqualTo(["a", "b"]));
    });

    test("forEachLte", () => {
      const map                   = fromNumbers([1, "a"], [2, "b"], [3, "c"]);
      const result: Array<string> = [];
      map.forEachLte(2, (_, v) => {
        result.push(v);
      });
      return result.assert(deepEqualTo(["a", "b"]));
    });

    test("forEachGt", () => {
      const map                   = fromNumbers([1, "a"], [2, "b"], [3, "c"]);
      const result: Array<string> = [];
      map.forEachGt(1, (_, v) => {
        result.push(v);
      });
      return result.assert(deepEqualTo(["b", "c"]));
    });

    test("forEachGte", () => {
      const map                   = fromNumbers([1, "a"], [2, "b"], [3, "c"]);
      const result: Array<string> = [];
      map.forEachGte(2, (_, v) => {
        result.push(v);
      });
      return result.assert(deepEqualTo(["b", "c"]));
    });
  });

  suite("visit", () => {
    test("visitFull short-circuits", () => {
      const map    = fromNumbers([1, "a"], [2, "b"], [3, "c"]);
      const result = map.visitFull((k, v) => (k === 2 ? Just(v) : Nothing()));
      return result.assert(isJust(strictEqualTo("b")));
    });

    test("visitFull visits all when no short-circuit", () => {
      const map    = fromNumbers([1, "a"], [2, "b"]);
      const result = map.visitFull(() => Nothing());
      return result.assert(isNothing);
    });

    test("visitBetween", () => {
      const map    = fromNumbers([1, "a"], [2, "b"], [3, "c"], [4, "d"]);
      const result = map.visitBetween(2, 4, (k, v) => (k === 3 ? Just(v) : Nothing()));
      return result.assert(isJust(strictEqualTo("c")));
    });

    test("visitLte", () => {
      const map    = fromNumbers([1, "a"], [2, "b"], [3, "c"]);
      const result = map.visitLte(2, (k, v) => (k === 2 ? Just(v) : Nothing()));
      return result.assert(isJust(strictEqualTo("b")));
    });

    test("visitLt", () => {
      const map    = fromNumbers([1, "a"], [2, "b"], [3, "c"]);
      const result = map.visitLt(2, (k, v) => (k === 1 ? Just(v) : Nothing()));
      return result.assert(isJust(strictEqualTo("a")));
    });

    test("visitGte", () => {
      const map    = fromNumbers([1, "a"], [2, "b"], [3, "c"]);
      const result = map.visitGte(2, (k, v) => (k === 2 ? Just(v) : Nothing()));
      return result.assert(isJust(strictEqualTo("b")));
    });

    test("visitGt", () => {
      const map    = fromNumbers([1, "a"], [2, "b"], [3, "c"]);
      const result = map.visitGt(2, (k, v) => (k === 3 ? Just(v) : Nothing()));
      return result.assert(isJust(strictEqualTo("c")));
    });
  });

  suite("property-based", () => {
    test.io(
      "inserted entries iterate in sorted order",
      Gen.int.array.check((as) => {
        let map = SortedMap.make<number, number>(Number.Ord);
        for (const a of as) {
          map = map.set(a, a * 2);
        }
        const entries = Array.from(map);
        const sorted  = as.slice().sort((a, b) => a - b);
        return entries.assert(deepEqualTo(sorted.map((a): [number, number] => [a, a * 2])));
      }),
    );
    test.io(
      "insert then remove all yields empty",
      Gen.int.array.check((as) => {
        let map = SortedMap.make<number, number>(Number.Ord);
        for (const a of as) {
          map = map.set(a, a);
        }
        for (const a of as) {
          map = map.remove(a);
        }
        return map.isEmpty.assert(isTrue);
      }),
    );
  });
});
