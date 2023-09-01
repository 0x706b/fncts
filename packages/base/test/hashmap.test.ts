import { HashMap } from "@fncts/base/collection/immutable/HashMap";
import { isJust, isNothing } from "@fncts/test/control/Assertion";

class Key implements Equatable, Hashable {
  constructor(readonly n: number) {}

  get [Symbol.hash](): number {
    return Hashable.unknown(this.n);
  }

  [Symbol.equals](u: unknown): boolean {
    return u instanceof Key && this.n === u.n;
  }
}

class Value implements Equatable {
  constructor(readonly s: string) {}

  get [Symbol.hash](): number {
    return Hashable.unknown(this.s);
  }

  [Symbol.equals](u: unknown): boolean {
    return u instanceof Value && this.s === u.s;
  }
}

suite.concurrent("HashMap", () => {
  function key(n: number): Key {
    return new Key(n);
  }

  function value(s: string): Value {
    return new Value(s);
  }

  test("has", () => {
    const map = HashMap([key(0), value("a")]);
    return map.has(key(0)).assert(isTrue) && map.has(key(1)).assert(isFalse);
  });

  test("get", () => {
    const map = HashMap([key(0), value("a")]);
    return map.get(key(0)).assert(isJust(deepEqualTo(value("a")))) && map.get(key(1)).assert(isNothing);
  });

  test("set", () => {
    const map = HashMap.empty<Key, Value>().set(key(0), value("a"));
    return map.get(key(0)).assert(isJust(deepEqualTo(value("a"))));
  });

  test("mutation", () => {
    let map       = HashMap.empty();
    let assertion = map.editable.assert(strictEqualTo(true));
    map           = map.beginMutation;
    assertion     = assertion && map.editable.assert(strictEqualTo(true));
    map           = map.endMutation;
    assertion     = assertion && map.editable.assert(strictEqualTo(false));
    return assertion;
  });

  test("mutate", () => {
    const map    = HashMap.empty<number, string>();
    const result = map.mutate((map) => {
      map.set(0, "a");
    });
    return result.get(0).assert(isJust(strictEqualTo("a"))) && result.get(1).assert(isNothing);
  });

  test("flatMap", () => {
    const map1    = HashMap([key(0), value("a")], [key(1), value("bb")]);
    const result1 = map1.flatMap(({ s }) => {
      const newKey   = key(s.length);
      const newValue = value(s);
      return HashMap([newKey, newValue]);
    });
    return (
      result1.get(key(1)).assert(isJust(deepEqualTo(value("a")))) &&
      result1.get(key(2)).assert(isJust(deepEqualTo(value("bb")))) &&
      result1.get(key(3)).assert(isNothing)
    );
  });
});
