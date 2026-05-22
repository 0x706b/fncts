import { fromFoldable as hashMapFromFoldable, HashMap } from "@fncts/base/collection/immutable/HashMap";
import * as ReadonlyArray from "@fncts/base/collection/immutable/ReadonlyArray";
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

suite("HashMap", () => {
  function key(n: number): Key {
    return new Key(n);
  }

  function value(s: string): Value {
    return new Value(s);
  }

  function numberEntries<A>(map: HashMap<number, A>): Array<[number, A]> {
    return Array.from(map, ([k, v]) => [k, v] as [number, A]).sort(([a], [b]) => a - b);
  }

  test("isEmpty", () => {
    return HashMap.empty<number, string>().isEmpty.assert(isTrue) && HashMap([0, "a"]).isEmpty.assert(isFalse);
  });

  test("makeWith", () => {
    const map = HashMap.makeWith<string, number>({
      hash: () => 0,
      equals: (y) => (x) => x.toLowerCase() === y.toLowerCase(),
    }).set("A", 1);
    return map.get("a").assert(isJust(strictEqualTo(1)));
  });

  test("make", () => {
    return numberEntries(HashMap([0, "a"], [1, "b"])).assert(
      deepEqualTo([
        [0, "a"],
        [1, "b"],
      ]),
    );
  });

  test("from", () => {
    return numberEntries(
      HashMap.from(
        new Map<number, string>([
          [0, "a"],
          [1, "b"],
        ]),
      ),
    ).assert(
      deepEqualTo([
        [0, "a"],
        [1, "b"],
      ]),
    );
  });

  test("empty", () => {
    return HashMap.empty<number, string>().size.assert(strictEqualTo(0));
  });

  test("fromFoldable", () => {
    const map = hashMapFromFoldable(
      HashMap.empty<number, string>().config,
      { combine: (y: string) => (x: string) => x + y },
      ReadonlyArray.Foldable,
    )([
      [0, "a"],
      [0, "b"],
      [1, "c"],
    ] as const);
    return numberEntries(map).assert(
      deepEqualTo([
        [0, "ab"],
        [1, "c"],
      ]),
    );
  });

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
    const map         = HashMap.empty();
    const mapEditable = map.editable;

    const mutableMap         = map.beginMutation;
    const mutableMapEditable = mutableMap.editable;

    const immutableMap         = mutableMap.endMutation;
    const immutableMapEditable = immutableMap.editable;

    return mapEditable.assert(isFalse) && mutableMapEditable.assert(isTrue) && immutableMapEditable.assert(isFalse);
  });

  test("mutate", () => {
    const map    = HashMap.empty<number, string>();
    const result = map.mutate((map) => {
      map.set(0, "a");
    });
    return result.get(0).assert(isJust(strictEqualTo("a"))) && result.get(1).assert(isNothing);
  });

  test("getHash", () => {
    const k   = key(0);
    const map = HashMap([k, value("a")]);
    return map.getHash(key(0), k[Symbol.hash]).assert(isJust(deepEqualTo(value("a"))));
  });

  test("hasHash", () => {
    const k   = key(0);
    const map = HashMap([k, value("a")]);
    return map.hasHash(key(0), k[Symbol.hash]).assert(isTrue) && map.hasHash(key(1), k[Symbol.hash]).assert(isFalse);
  });

  test("modifyHash", () => {
    const k   = key(0);
    const map = HashMap.empty<Key, Value>().modifyHash(k, k[Symbol.hash], () => Just(value("a")));
    return map.get(k).assert(isJust(deepEqualTo(value("a"))));
  });

  test("modify", () => {
    const map = HashMap([0, "a"]).modify(0, (v) => Just(`${v.value}!`));
    return map.get(0).assert(isJust(strictEqualTo("a!")));
  });

  test("remove", () => {
    const map = HashMap([0, "a"]).remove(0);
    return map.has(0).assert(isFalse);
  });

  test("removeMany", () => {
    return numberEntries(HashMap([0, "a"], [1, "b"], [2, "c"]).removeMany([0, 2])).assert(deepEqualTo([[1, "b"]]));
  });

  test("keys", () => {
    return Array.from(HashMap([0, "a"], [1, "b"]).keys)
      .sort((a, b) => a - b)
      .assert(deepEqualTo([0, 1]));
  });

  test("keySet", () => {
    const set = HashMap([0, "a"], [1, "b"]).keySet;
    return set.size.assert(strictEqualTo(2)) && set.has(0).assert(isTrue) && set.has(1).assert(isTrue);
  });

  test("toSet", () => {
    const set = HashMap([0, "a"], [1, "a"], [2, "b"]).toSet;
    return set.size.assert(strictEqualTo(2)) && set.has("a").assert(isTrue) && set.has("b").assert(isTrue);
  });

  test("toList", () => {
    return Array.from(HashMap([0, "a"], [1, "b"]).toList, ([k, v]) => [k, v] as [number, string])
      .sort(([a], [b]) => a - b)
      .assert(
        deepEqualTo([
          [0, "a"],
          [1, "b"],
        ]),
      );
  });

  test("toArray", () => {
    return HashMap([0, "a"], [1, "b"])
      .toArray.map(([k, v]) => [k, v] as [number, string])
      .sort(([a], [b]) => a - b)
      .assert(
        deepEqualTo([
          [0, "a"],
          [1, "b"],
        ]),
      );
  });

  test("values", () => {
    return Array.from(HashMap([0, "b"], [1, "a"]).values)
      .sort()
      .assert(deepEqualTo(["a", "b"]));
  });

  test("update", () => {
    const map = HashMap([0, "a"]).update(0, (v) => v + "!");
    return map.get(0).assert(isJust(strictEqualTo("a!")));
  });

  test("forEachWithIndex", () => {
    const result: Array<string> = [];
    HashMap([0, "a"], [1, "b"]).forEachWithIndex((k, v) => {
      result.push(`${k}:${v}`);
    });
    return result.sort().assert(deepEqualTo(["0:a", "1:b"]));
  });

  test("forEach", () => {
    const result: Array<string> = [];
    HashMap([0, "b"], [1, "a"]).forEach((v) => {
      result.push(v);
    });
    return result.sort().assert(deepEqualTo(["a", "b"]));
  });

  test("mapWithIndex", () => {
    return numberEntries(HashMap([0, 1], [1, 2]).mapWithIndex((k, v) => k + v)).assert(
      deepEqualTo([
        [0, 1],
        [1, 3],
      ]),
    );
  });

  test("map", () => {
    return numberEntries(HashMap([0, 1], [1, 2]).map((v) => v + 1)).assert(
      deepEqualTo([
        [0, 2],
        [1, 3],
      ]),
    );
  });

  test("flatMapWithIndex", () => {
    return numberEntries(HashMap([0, "a"], [1, "b"]).flatMapWithIndex((k, v) => HashMap([k + 10, v + "!"]))).assert(
      deepEqualTo([
        [10, "a!"],
        [11, "b!"],
      ]),
    );
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

  test("compact", () => {
    return numberEntries(HashMap([0, Just("a")], [1, Nothing<string>()]).compact).assert(deepEqualTo([[0, "a"]]));
  });

  test("separate", () => {
    const [left, right] = HashMap([0, Either.left<string, number>("a")], [1, Either.right<string, number>(1)]).separate;
    return numberEntries(left).assert(deepEqualTo([[0, "a"]])) && numberEntries(right).assert(deepEqualTo([[1, 1]]));
  });

  test("filterMapWithIndex", () => {
    return numberEntries(HashMap([0, 1], [1, 2]).filterMapWithIndex((k, v) => (k === 1 ? Just(v) : Nothing()))).assert(
      deepEqualTo([[1, 2]]),
    );
  });

  test("filterMap", () => {
    return numberEntries(HashMap([0, 1], [1, 2]).filterMap((v) => (v % 2 === 0 ? Just(v * 2) : Nothing()))).assert(
      deepEqualTo([[1, 4]]),
    );
  });

  test("filterWithIndex", () => {
    return numberEntries(HashMap([0, 1], [1, 2]).filterWithIndex((k, v) => k === v - 1)).assert(
      deepEqualTo([
        [0, 1],
        [1, 2],
      ]),
    );
  });

  test("filter", () => {
    return numberEntries(HashMap([0, 1], [1, 2]).filter((v) => v % 2 === 0)).assert(deepEqualTo([[1, 2]]));
  });

  test("partitionMapWithIndex", () => {
    const [left, right] = HashMap([0, 1], [1, 2]).partitionMapWithIndex((k, v) =>
      k === 0 ? Either.left(v) : Either.right(v),
    );
    return numberEntries(left).assert(deepEqualTo([[0, 1]])) && numberEntries(right).assert(deepEqualTo([[1, 2]]));
  });

  test("partitionMap", () => {
    const [left, right] = HashMap([0, 1], [1, 2]).partitionMap((v) => (v % 2 === 0 ? Either.right(v) : Either.left(v)));
    return numberEntries(left).assert(deepEqualTo([[0, 1]])) && numberEntries(right).assert(deepEqualTo([[1, 2]]));
  });

  test("partitionWithIndex", () => {
    const [left, right] = HashMap([0, 1], [1, 2]).partitionWithIndex((k, v) => k === v - 1);
    return (
      numberEntries(left).assert(deepEqualTo([] as Array<[number, number]>)) &&
      numberEntries(right).assert(
        deepEqualTo([
          [0, 1],
          [1, 2],
        ]),
      )
    );
  });

  test("partition", () => {
    const [left, right] = HashMap([0, 1], [1, 2]).partition((v) => v % 2 === 0);
    return numberEntries(left).assert(deepEqualTo([[0, 1]])) && numberEntries(right).assert(deepEqualTo([[1, 2]]));
  });

  test("foldLeftWithIndexWhile", () => {
    const visited: Array<number> = [];
    const result                 = HashMap([0, 1], [1, 2], [2, 3]).foldLeftWithIndexWhile(
      0,
      (_, sum, v) => {
        visited.push(v);
        return sum + v;
      },
      (sum) => sum < 3,
    );
    return result.assert(strictEqualTo(3)) && visited.length.assert(strictEqualTo(2));
  });

  test("foldLeftWithIndex", () => {
    return HashMap([0, 1], [1, 2])
      .foldLeftWithIndex(0, (k, sum, v) => sum + k + v)
      .assert(strictEqualTo(4));
  });

  test("foldLeftWhile", () => {
    const visited: Array<number> = [];
    const result                 = HashMap([0, 1], [1, 2], [2, 3]).foldLeftWhile(
      0,
      (sum, v) => {
        visited.push(v);
        return sum + v;
      },
      (sum) => sum < 3,
    );
    return result.assert(strictEqualTo(3)) && visited.length.assert(strictEqualTo(2));
  });

  test("foldLeft", () => {
    return HashMap([0, 1], [1, 2])
      .foldLeft(0, (sum, v) => sum + v)
      .assert(strictEqualTo(3));
  });

  test("findWithIndex", () => {
    return HashMap([0, 1], [1, 2])
      .findWithIndex((k, v) => k === 1 && v === 2)
      .assert(isJust(strictEqualTo(2)));
  });

  test("find", () => {
    return HashMap([0, 1], [1, 2])
      .find((v) => v === 1)
      .assert(isJust(strictEqualTo(1)));
  });

  test("traverseWithIndex", () => {
    const result = HashMap([0, 1], [1, 2]).traverseWithIndex(Maybe.Applicative)((k, v) => Just(k + v));
    return result.assert(isJust(deepEqualTo(HashMap([0, 1], [1, 3]))));
  });

  test("traverse", () => {
    const result = HashMap([0, 1], [1, 2]).traverse(Maybe.Applicative)((v) => Just(v + 1));
    return result.assert(isJust(deepEqualTo(HashMap([0, 2], [1, 3]))));
  });

  test("unsafeGet", () => {
    return HashMap([0, "a"]).unsafeGet(0)!.assert(strictEqualTo("a"));
  });

  test("witherWithIndex", () => {
    const result = HashMap([0, 1], [1, 2]).witherWithIndex(Maybe.Applicative)((k, v) =>
      Just(k === 1 ? Just(v) : Nothing()),
    );
    return result.assert(isJust(deepEqualTo(HashMap([1, 2]))));
  });

  test("wither", () => {
    const result = HashMap([0, 1], [1, 2]).wither(Maybe.Applicative)((v) => Just(v % 2 === 0 ? Just(v) : Nothing()));
    return result.assert(isJust(deepEqualTo(HashMap([1, 2]))));
  });

  test("wiltWithIndex", () => {
    const result = HashMap([0, 1], [1, 2]).wiltWithIndex(Maybe.Applicative)((k, v) =>
      Just(k === 0 ? Either.left(v) : Either.right(v)),
    );
    return result.assert(isJust(deepEqualTo([HashMap([0, 1]), HashMap([1, 2])] as const)));
  });

  test("wilt", () => {
    const result = HashMap([0, 1], [1, 2]).wilt(Maybe.Applicative)((v) =>
      Just(v % 2 === 0 ? Either.right(v) : Either.left(v)),
    );
    return result.assert(isJust(deepEqualTo([HashMap([0, 1]), HashMap([1, 2])] as const)));
  });

  test("unionWith", () => {
    return numberEntries(
      HashMap([0, 1]).unionWith(
        [
          [0, 2],
          [1, 3],
        ],
        (x, y) => x + y,
      ),
    ).assert(
      deepEqualTo([
        [0, 3],
        [1, 3],
      ]),
    );
  });

  test("union", () => {
    return numberEntries(
      HashMap([0, 1]).union([
        [0, 2],
        [1, 3],
      ]),
    ).assert(
      deepEqualTo([
        [0, 2],
        [1, 3],
      ]),
    );
  });

  test("pop", () => {
    const result = HashMap([0, "a"], [1, "b"]).pop(0);
    return (
      result.isJust().assert(isTrue) &&
      result.value![0].assert(strictEqualTo("a")) &&
      numberEntries(result.value![1]).assert(deepEqualTo([[1, "b"]]))
    );
  });
});
