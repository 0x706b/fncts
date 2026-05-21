import type {} from "@fncts/base/global";
import type {} from "@fncts/io/global";

import { HashMap } from "@fncts/base/collection/mutable/HashMap";
import { HashEq } from "@fncts/base/data/HashEq";
import { isJust, isNothing } from "@fncts/test/control/Assertion";

suite.concurrent("MutableHashMap", () => {
  suite.concurrent("empty", () => {
    test("creates an empty map", () => {
      const map = HashMap.empty<number, string>();
      return map.size.assert(strictEqualTo(0));
    });

    test("empty map has no keys", () => {
      const map = HashMap.empty<number, string>();
      return map.has(0).assert(isFalse);
    });

    test("empty map get returns Nothing", () => {
      const map = HashMap.empty<number, string>();
      return map.get(0).assert(isNothing);
    });

    test("empty map unsafeGet returns undefined", () => {
      const map = HashMap.empty<number, string>();
      return (map.unsafeGet(0) === undefined).assert(isTrue);
    });
  });

  suite.concurrent("size", () => {
    test("size increases on insert", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      return map.size.assert(strictEqualTo(1));
    });

    test("size unchanged on update", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      map.set(0, "b");
      return map.size.assert(strictEqualTo(1));
    });

    test("size decreases on delete", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      map.delete(0);
      return map.size.assert(strictEqualTo(0));
    });

    test("size after multiple operations", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      map.set(1, "b");
      map.set(2, "c");
      map.delete(1);
      return map.size.assert(strictEqualTo(2));
    });
  });

  suite.concurrent("has", () => {
    test("returns false for missing key", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      return map.has(1).assert(isFalse);
    });

    test("returns true for existing key", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      return map.has(0).assert(isTrue);
    });

    test("returns false after delete", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      map.delete(0);
      return map.has(0).assert(isFalse);
    });
  });

  suite.concurrent("unsafeGet", () => {
    test("returns value for existing key", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      return map.unsafeGet(0)!.assert(strictEqualTo("a"));
    });

    test("returns undefined for missing key", () => {
      const map = HashMap.empty<number, string>();
      return (map.unsafeGet(0) === undefined).assert(isTrue);
    });
  });

  suite.concurrent("get", () => {
    test("returns Just for existing key", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      return map.get(0).assert(isJust(strictEqualTo("a")));
    });

    test("returns Nothing for missing key", () => {
      const map = HashMap.empty<number, string>();
      return map.get(0).assert(isNothing);
    });
  });

  suite.concurrent("set", () => {
    test("inserts new key and returns Nothing", () => {
      const map = HashMap.empty<number, string>();
      const old = map.set(0, "a");
      return old.assert(isNothing) && map.get(0).assert(isJust(strictEqualTo("a")));
    });

    test("updates existing key and returns Just(old)", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      const old = map.set(0, "b");
      return old.assert(isJust(strictEqualTo("a"))) && map.get(0).assert(isJust(strictEqualTo("b")));
    });

    test("multiple inserts", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      map.set(1, "b");
      map.set(2, "c");
      return (
        map.get(0).assert(isJust(strictEqualTo("a"))) &&
        map.get(1).assert(isJust(strictEqualTo("b"))) &&
        map.get(2).assert(isJust(strictEqualTo("c")))
      );
    });
  });

  suite.concurrent("delete", () => {
    test("removes existing key and returns Just(value)", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      const removed = map.delete(0);
      return removed.assert(isJust(strictEqualTo("a"))) && map.has(0).assert(isFalse);
    });

    test("returns Nothing for missing key", () => {
      const map     = HashMap.empty<number, string>();
      const removed = map.delete(0);
      return removed.assert(isNothing);
    });

    test("deleting from populated map", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      map.set(1, "b");
      map.set(2, "c");
      map.delete(1);
      return map.has(1).assert(isFalse) && map.size.assert(strictEqualTo(2));
    });
  });

  suite.concurrent("clear", () => {
    test("removes all entries", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      map.set(1, "b");
      map.clear();
      return map.size.assert(strictEqualTo(0)) && map.has(0).assert(isFalse) && map.has(1).assert(isFalse);
    });

    test("clear on empty map", () => {
      const map = HashMap.empty<number, string>();
      map.clear();
      return map.size.assert(strictEqualTo(0));
    });
  });

  suite.concurrent("updateWith", () => {
    test("inserts when key missing and f returns Just", () => {
      const map    = HashMap.empty<number, string>();
      const result = map.updateWith(0, () => Just("a"));
      return result.assert(isJust(strictEqualTo("a"))) && map.get(0).assert(isJust(strictEqualTo("a")));
    });

    test("does nothing when key missing and f returns Nothing", () => {
      const map    = HashMap.empty<number, string>();
      const result = map.updateWith(0, () => Nothing());
      return result.assert(isNothing) && map.has(0).assert(isFalse) && map.size.assert(strictEqualTo(0));
    });

    test("updates when key exists and f returns Just", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      const result = map.updateWith(0, (mv) => Just(`${mv.value}!`));
      return result.assert(isJust(strictEqualTo("a!"))) && map.get(0).assert(isJust(strictEqualTo("a!")));
    });

    test("deletes when key exists and f returns Nothing", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      const result = map.updateWith(0, () => Nothing());
      return result.assert(isNothing) && map.has(0).assert(isFalse) && map.size.assert(strictEqualTo(0));
    });
  });

  suite.concurrent("forEach", () => {
    test("visits all entries", () => {
      const map = HashMap.empty<number, string>();
      const visited: Array<[number, string]> = [];
      map.set(0, "a");
      map.set(1, "b");
      map.forEach((k, v) => visited.push([k, v]));
      return visited
        .sort(([a], [b]) => a - b)
        .assert(
          deepEqualTo([
            [0, "a"],
            [1, "b"],
          ]),
        );
    });

    test("does not call callback on empty map", () => {
      const map  = HashMap.empty<number, string>();
      let called = 0;
      map.forEach(() => called++);
      return called.assert(strictEqualTo(0));
    });
  });

  suite.concurrent("iteration", () => {
    test("yields all entries via for...of", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      map.set(1, "b");
      const entries: Array<readonly [number, string]> = [];
      for (const entry of map) {
        entries.push(entry);
      }
      return entries
        .sort(([a], [b]) => a - b)
        .assert(
          deepEqualTo([
            [0, "a"],
            [1, "b"],
          ]),
        );
    });

    test("iterator on empty map returns done immediately", () => {
      const map      = HashMap.empty<number, string>();
      const iterator = map[Symbol.iterator]();
      const first    = iterator.next();
      return first.done!.assert(isTrue);
    });
  });

  suite.concurrent("collision handling", () => {
    test("stores multiple keys with same hash", () => {
      const config = HashEq({
        hash: () => 0,
        equals: (y: string) => (x: string) => x === y,
      });
      const map = HashMap.empty<string, number>(config);
      map.set("a", 1);
      map.set("b", 2);
      map.set("c", 3);
      return (
        map.size.assert(strictEqualTo(3)) &&
        map.get("a").assert(isJust(strictEqualTo(1))) &&
        map.get("b").assert(isJust(strictEqualTo(2))) &&
        map.get("c").assert(isJust(strictEqualTo(3)))
      );
    });

    test("updates correct key in collision chain", () => {
      const config = HashEq({
        hash: () => 0,
        equals: (y: string) => (x: string) => x === y,
      });
      const map = HashMap.empty<string, number>(config);
      map.set("a", 1);
      map.set("b", 2);
      map.set("a", 10);
      return map.get("a").assert(isJust(strictEqualTo(10))) && map.get("b").assert(isJust(strictEqualTo(2)));
    });

    test("deletes correct key from collision chain", () => {
      const config = HashEq({
        hash: () => 0,
        equals: (y: string) => (x: string) => x === y,
      });
      const map = HashMap.empty<string, number>(config);
      map.set("a", 1);
      map.set("b", 2);
      map.set("c", 3);
      map.delete("b");
      return (
        map.has("a").assert(isTrue) &&
        map.has("b").assert(isFalse) &&
        map.has("c").assert(isTrue) &&
        map.size.assert(strictEqualTo(2))
      );
    });

    test("collision chain survives table growth", () => {
      const config = HashEq({
        hash: () => 0,
        equals: (y: string) => (x: string) => x === y,
      });
      const map = HashMap.empty<string, number>(config);
      for (let i = 0; i < 32; i++) {
        map.set(`key-${i}`, i);
      }
      return (
        map.size.assert(strictEqualTo(32)) &&
        map.get("key-0").assert(isJust(strictEqualTo(0))) &&
        map.get("key-15").assert(isJust(strictEqualTo(15))) &&
        map.get("key-31").assert(isJust(strictEqualTo(31)))
      );
    });
  });

  suite.concurrent("table growth", () => {
    test("grows table when threshold exceeded", () => {
      const map = HashMap.empty<number, string>();
      for (let i = 0; i < 20; i++) {
        map.set(i, `v${i}`);
      }
      return map.size.assert(strictEqualTo(20)) && map.get(15).assert(isJust(strictEqualTo("v15")));
    });

    test("entries remain accessible after multiple growths", () => {
      const map = HashMap.empty<number, number>();
      for (let i = 0; i < 1000; i++) {
        map.set(i, i * 2);
      }
      let allCorrect = true;
      for (let i = 0; i < 1000; i++) {
        if (map.unsafeGet(i) !== i * 2) {
          allCorrect = false;
          break;
        }
      }
      return allCorrect.assert(isTrue) && map.size.assert(strictEqualTo(1000));
    });

    test("deletion works after growth", () => {
      const map = HashMap.empty<number, string>();
      for (let i = 0; i < 100; i++) {
        map.set(i, `v${i}`);
      }
      for (let i = 0; i < 50; i++) {
        map.delete(i);
      }
      return map.size.assert(strictEqualTo(50));
    });
  });

  suite.concurrent("custom HashEq", () => {
    test("custom equality determines key match", () => {
      const config = HashEq({
        hash: (s: string) => s.length,
        equals: (y: string) => (x: string) => x.toLowerCase() === y.toLowerCase(),
      });
      const map = HashMap.empty<string, number>(config);
      map.set("Hello", 1);
      return map.get("hello").assert(isJust(strictEqualTo(1))) && map.get("HELLO").assert(isJust(strictEqualTo(1)));
    });

    test("custom hash affects bucketing", () => {
      const config = HashEq({
        hash: (s: string) => s.charCodeAt(0),
        equals: (y: string) => (x: string) => x === y,
      });
      const map = HashMap.empty<string, number>(config);
      map.set("a", 1);
      map.set("b", 2);
      map.set("c", 3);
      return map.size.assert(strictEqualTo(3));
    });
  });

  suite.concurrent("mutation in place", () => {
    test("same instance is mutated by set", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      return map.has(0).assert(isTrue) && map.size.assert(strictEqualTo(1));
    });

    test("same instance is mutated by delete", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      map.delete(0);
      return map.has(0).assert(isFalse) && map.size.assert(strictEqualTo(0));
    });

    test("same instance is mutated by clear", () => {
      const map = HashMap.empty<number, string>();
      map.set(0, "a");
      map.clear();
      return map.size.assert(strictEqualTo(0));
    });
  });
});
