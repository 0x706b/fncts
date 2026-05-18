import { HashEq } from "@fncts/base/typeclass";

suite.concurrent("HashSet", () => {
  suite("from", () => {
    test("creates empty set from empty iterable", () => {
      const set = HashSet.from([]);
      return set.size.assert(strictEqualTo(0));
    });

    test("creates set from array", () => {
      const set = HashSet.from([1, 2, 3]);
      return (
        set.size.assert(strictEqualTo(3)) &&
        set.has(1).assert(isTrue) &&
        set.has(2).assert(isTrue) &&
        set.has(3).assert(isTrue)
      );
    });

    test("deduplicates elements", () => {
      const set = HashSet.from([1, 2, 2, 3, 3, 3]);
      return set.size.assert(strictEqualTo(3));
    });

    test("creates set from iterable", () => {
      const iterable = (function* () {
        yield 1;
        yield 2;
        yield 3;
      })();
      const set = HashSet.from(iterable);
      return set.size.assert(strictEqualTo(3));
    });
  });

  suite("add", () => {
    test("adds element to empty set", () => {
      const set = HashSet.empty<number>().add(1);
      return set.size.assert(strictEqualTo(1)) && set.has(1).assert(isTrue);
    });

    test("adds element to non-empty set", () => {
      const set = HashSet.make(1, 2).add(3);
      return set.size.assert(strictEqualTo(3)) && set.has(3).assert(isTrue);
    });

    test("does not add duplicate element", () => {
      const set = HashSet.make(1, 2).add(2);
      return set.size.assert(strictEqualTo(2));
    });

    test("returns new set (immutability)", () => {
      const original = HashSet.make(1, 2);
      const modified = original.add(3);
      return original.size.assert(strictEqualTo(2)) && modified.size.assert(strictEqualTo(3));
    });
  });

  suite("beginMutation", () => {
    test("returns editable set", () => {
      const set     = HashSet.make(1, 2, 3);
      const mutable = set.beginMutation;
      return mutable._editable.assert(isTrue);
    });

    test("increments edit counter", () => {
      const set     = HashSet.make(1, 2, 3);
      const mutable = set.beginMutation;
      return mutable._edit.assert(strictEqualTo(set._edit + 1));
    });

    test("preserves elements", () => {
      const set     = HashSet.make(1, 2, 3);
      const mutable = set.beginMutation;
      return mutable.size.assert(strictEqualTo(3));
    });
  });

  suite("endMutation", () => {
    test("returns immutable set", () => {
      const set       = HashSet.make(1, 2, 3).beginMutation;
      const immutable = set.endMutation;
      return immutable._editable.assert(isFalse);
    });

    test("preserves elements after mutation", () => {
      const mutable = HashSet.empty<number>().beginMutation;
      mutable.add(1);
      mutable.add(2);
      const immutable = mutable.endMutation;
      return (
        immutable.size.assert(strictEqualTo(2)) && immutable.has(1).assert(isTrue) && immutable.has(2).assert(isTrue)
      );
    });
  });

  suite("forEach", () => {
    test("visits all elements", () => {
      const visited: Array<number> = [];
      HashSet.make(1, 2, 3).forEach((v) => visited.push(v));
      return visited.sort().assert(deepEqualTo([1, 2, 3]));
    });

    test("works with empty set", () => {
      let called = false;
      HashSet.empty<number>().forEach(() => {
        called = true;
      });
      return called.assert(isFalse);
    });

    test("provides set as second argument", () => {
      const set = HashSet.make(1, 2);
      let receivedSet: HashSet<number> | undefined;
      set.forEach((_v, s) => {
        receivedSet = s;
      });
      return receivedSet!.size.assert(strictEqualTo(2));
    });
  });

  suite("has", () => {
    test("returns true for existing element", () => {
      return HashSet.make(1, 2, 3).has(2).assert(isTrue);
    });

    test("returns false for non-existing element", () => {
      return HashSet.make(1, 2, 3).has(4).assert(isFalse);
    });

    test("returns false for empty set", () => {
      return HashSet.empty<number>().has(1).assert(isFalse);
    });
  });

  suite("emptyWith", () => {
    test("creates empty set with custom config", () => {
      const config = HashEq.StructuralStrict;
      const set    = HashSet.emptyWith(config);
      return set.size.assert(strictEqualTo(0)) && set.config.assert(strictEqualTo(config));
    });
  });

  suite("empty", () => {
    test("creates empty set", () => {
      const set = HashSet.empty<number>();
      return set.size.assert(strictEqualTo(0));
    });

    test("uses structural strict hash eq by default", () => {
      const set = HashSet.empty<number>();
      return set.config.assert(strictEqualTo(HashEq.StructuralStrict));
    });
  });

  suite("make", () => {
    test("creates empty set with no arguments", () => {
      const set = HashSet.make();
      return set.size.assert(strictEqualTo(0));
    });

    test("creates set with single element", () => {
      const set = HashSet.make(1);
      return set.size.assert(strictEqualTo(1)) && set.has(1).assert(isTrue);
    });

    test("creates set with multiple elements", () => {
      const set = HashSet.make(1, 2, 3, 4, 5);
      return (
        set.size.assert(strictEqualTo(5)) &&
        set.has(1).assert(isTrue) &&
        set.has(2).assert(isTrue) &&
        set.has(3).assert(isTrue) &&
        set.has(4).assert(isTrue) &&
        set.has(5).assert(isTrue)
      );
    });

    test("deduplicates elements", () => {
      const set = HashSet.make(1, 2, 2, 3, 3, 3);
      return set.size.assert(strictEqualTo(3));
    });
  });

  suite("mutate", () => {
    test("allows multiple operations", () => {
      const set = HashSet.empty<number>().mutate((s) => {
        s.add(1);
        s.add(2);
        s.add(3);
      });
      return set.size.assert(strictEqualTo(3));
    });

    test("returns immutable set", () => {
      const set = HashSet.empty<number>().mutate((s) => {
        s.add(1);
      });
      return set._editable.assert(isFalse);
    });

    test("original set is unchanged", () => {
      const original = HashSet.make(1, 2);
      const modified = original.mutate((s) => {
        s.add(3);
        s.remove(1);
      });
      return (
        original.size.assert(strictEqualTo(2)) &&
        original.has(1).assert(isTrue) &&
        modified.size.assert(strictEqualTo(2)) &&
        modified.has(1).assert(isFalse) &&
        modified.has(3).assert(isTrue)
      );
    });
  });

  suite("remove", () => {
    test("removes existing element", () => {
      const set = HashSet.make(1, 2, 3).remove(2);
      return set.size.assert(strictEqualTo(2)) && set.has(2).assert(isFalse);
    });

    test("does nothing for non-existing element", () => {
      const set = HashSet.make(1, 2, 3).remove(4);
      return set.size.assert(strictEqualTo(3));
    });

    test("returns empty set when removing last element", () => {
      const set = HashSet.make(1).remove(1);
      return set.size.assert(strictEqualTo(0));
    });

    test("returns new set (immutability)", () => {
      const original = HashSet.make(1, 2, 3);
      const modified = original.remove(2);
      return original.has(2).assert(isTrue) && modified.has(2).assert(isFalse);
    });
  });

  suite("removeMany", () => {
    test("removes multiple elements", () => {
      const set = HashSet.make(1, 2, 3, 4, 5).removeMany([2, 4]);
      return (
        set.size.assert(strictEqualTo(3)) &&
        set.has(1).assert(isTrue) &&
        set.has(2).assert(isFalse) &&
        set.has(3).assert(isTrue) &&
        set.has(4).assert(isFalse) &&
        set.has(5).assert(isTrue)
      );
    });

    test("handles non-existing elements", () => {
      const set = HashSet.make(1, 2, 3).removeMany([4, 5]);
      return set.size.assert(strictEqualTo(3));
    });

    test("handles empty iterable", () => {
      const set = HashSet.make(1, 2, 3).removeMany([]);
      return set.size.assert(strictEqualTo(3));
    });
  });

  suite("size", () => {
    test("returns 0 for empty set", () => {
      return HashSet.empty<number>().size.assert(strictEqualTo(0));
    });

    test("returns correct size", () => {
      return HashSet.make(1, 2, 3, 4, 5).size.assert(strictEqualTo(5));
    });
  });

  suite("toggle", () => {
    test("adds element when not present", () => {
      const set = HashSet.make(1, 2).toggle(3);
      return set.size.assert(strictEqualTo(3)) && set.has(3).assert(isTrue);
    });

    test("removes element when present", () => {
      const set = HashSet.make(1, 2, 3).toggle(2);
      return set.size.assert(strictEqualTo(2)) && set.has(2).assert(isFalse);
    });

    test("toggling twice returns original set", () => {
      const original = HashSet.make(1, 2);
      const toggled  = original.toggle(2).toggle(2);
      return toggled.size.assert(strictEqualTo(2)) && toggled.has(2).assert(isTrue);
    });
  });

  suite("mapWith", () => {
    test("transforms elements with custom config", () => {
      const config = HashEq.StructuralStrict as HashEq<string>;
      const set    = HashSet.mapWith(config)((n: number) => n.toString())(HashSet.make(1, 2, 3));
      return (
        set.size.assert(strictEqualTo(3)) &&
        set.has("1").assert(isTrue) &&
        set.has("2").assert(isTrue) &&
        set.has("3").assert(isTrue)
      );
    });

    test("deduplicates after transformation", () => {
      const set = HashSet.mapWith(HashEq.StructuralStrict)((n: number) => n % 2)(HashSet.make(1, 2, 3, 4));
      return set.size.assert(strictEqualTo(2));
    });
  });

  suite("map", () => {
    test("transforms elements", () => {
      const set = HashSet.make(1, 2, 3).map((n) => n * 2);
      return (
        set.size.assert(strictEqualTo(3)) &&
        set.has(2).assert(isTrue) &&
        set.has(4).assert(isTrue) &&
        set.has(6).assert(isTrue)
      );
    });

    test("works with empty set", () => {
      const set = HashSet.empty<number>().map((n) => n * 2);
      return set.size.assert(strictEqualTo(0));
    });

    test("deduplicates after transformation", () => {
      const set = HashSet.make(1, 2, 3, 4).map((n) => n % 2);
      return set.size.assert(strictEqualTo(2));
    });
  });

  suite("flatMapWith", () => {
    test("transforms and flattens with custom config", () => {
      const config = HashEq.StructuralStrict;
      const set    = HashSet.flatMapWith(config)((n: number) => [n, n * 10])(HashSet.make(1, 2, 3));
      return (
        set.has(1).assert(isTrue) &&
        set.has(2).assert(isTrue) &&
        set.has(3).assert(isTrue) &&
        set.has(10).assert(isTrue) &&
        set.has(20).assert(isTrue) &&
        set.has(30).assert(isTrue)
      );
    });
  });

  suite("flatMap", () => {
    test("transforms and flattens", () => {
      const set = HashSet.make(1, 2, 3).flatMap((n) => [n, n * 10]);
      return (
        set.size.assert(strictEqualTo(6)) &&
        set.has(1).assert(isTrue) &&
        set.has(2).assert(isTrue) &&
        set.has(3).assert(isTrue) &&
        set.has(10).assert(isTrue) &&
        set.has(20).assert(isTrue) &&
        set.has(30).assert(isTrue)
      );
    });

    test("handles empty result", () => {
      const set = HashSet.make(1, 2, 3).flatMap(() => []);
      return set.size.assert(strictEqualTo(0));
    });

    test("deduplicates flattened results", () => {
      const set = HashSet.make(1, 2).flatMap((n) => [n, n]);
      return set.size.assert(strictEqualTo(2));
    });
  });

  suite("getEq", () => {
    test("same instance is equal", () => {
      const set = HashSet.make(1, 2, 3);
      const eq  = HashSet.getEq<number>();
      return eq.equals(set)(set).assert(isTrue);
    });

    test("equal sets with same elements", () => {
      const set1 = HashSet.make(1, 2, 3);
      const set2 = HashSet.make(3, 2, 1);
      const eq   = HashSet.getEq<number>();
      return eq.equals(set2)(set1).assert(isTrue);
    });

    test("different sizes are not equal", () => {
      const set1 = HashSet.make(1, 2);
      const set2 = HashSet.make(1, 2, 3);
      const eq   = HashSet.getEq<number>();
      return eq.equals(set2)(set1).assert(isFalse);
    });

    test("different elements are not equal", () => {
      const set1 = HashSet.make(1, 2, 3);
      const set2 = HashSet.make(1, 2, 4);
      const eq   = HashSet.getEq<number>();
      return eq.equals(set2)(set1).assert(isFalse);
    });

    test("empty sets are equal", () => {
      const set1 = HashSet.empty<number>();
      const set2 = HashSet.empty<number>();
      const eq   = HashSet.getEq<number>();
      return eq.equals(set2)(set1).assert(isTrue);
    });
  });

  suite("filter", () => {
    test("filters elements", () => {
      const set = HashSet.make(1, 2, 3, 4, 5).filter((n) => n % 2 === 0);
      return set.size.assert(strictEqualTo(2)) && set.has(2).assert(isTrue) && set.has(4).assert(isTrue);
    });

    test("returns empty set when no elements match", () => {
      const set = HashSet.make(1, 3, 5).filter((n) => n % 2 === 0);
      return set.size.assert(strictEqualTo(0));
    });

    test("returns all elements when all match", () => {
      const set = HashSet.make(1, 2, 3).filter(() => true);
      return set.size.assert(strictEqualTo(3));
    });

    test("works with empty set", () => {
      const set = HashSet.empty<number>().filter(() => true);
      return set.size.assert(strictEqualTo(0));
    });
  });

  suite("filterMapWith", () => {
    test("filters and maps with custom config", () => {
      const config = HashEq.StructuralStrict;
      const set    = HashSet.filterMapWith(config)((n: number) => (n % 2 === 0 ? Just(n.toString()) : Nothing()))(
        HashSet.make(1, 2, 3, 4),
      );
      return set.size.assert(strictEqualTo(2)) && set.has("2").assert(isTrue) && set.has("4").assert(isTrue);
    });
  });

  suite("filterMap", () => {
    test("filters and maps", () => {
      const set = HashSet.make(1, 2, 3, 4).filterMap((n) => (n % 2 === 0 ? Just(n * 2) : Nothing()));
      return set.size.assert(strictEqualTo(2)) && set.has(4).assert(isTrue) && set.has(8).assert(isTrue);
    });

    test("returns empty set when all filtered", () => {
      const set = HashSet.make(1, 2, 3).filterMap(() => Nothing());
      return set.size.assert(strictEqualTo(0));
    });

    test("works with empty set", () => {
      const set = HashSet.empty<number>().filterMap(() => Just(1));
      return set.size.assert(strictEqualTo(0));
    });
  });

  suite("partition", () => {
    test("partitions elements by predicate", () => {
      const [left, right] = HashSet.make(1, 2, 3, 4, 5).partition((n) => n % 2 === 0);
      return (
        left.size.assert(strictEqualTo(3)) &&
        right.size.assert(strictEqualTo(2)) &&
        left.has(1).assert(isTrue) &&
        left.has(3).assert(isTrue) &&
        left.has(5).assert(isTrue) &&
        right.has(2).assert(isTrue) &&
        right.has(4).assert(isTrue)
      );
    });

    test("handles all matching", () => {
      const [left, right] = HashSet.make(2, 4, 6).partition((n) => n % 2 === 0);
      return left.size.assert(strictEqualTo(0)) && right.size.assert(strictEqualTo(3));
    });

    test("handles none matching", () => {
      const [left, right] = HashSet.make(1, 3, 5).partition((n) => n % 2 === 0);
      return left.size.assert(strictEqualTo(3)) && right.size.assert(strictEqualTo(0));
    });

    test("works with empty set", () => {
      const [left, right] = HashSet.empty<number>().partition(() => true);
      return left.size.assert(strictEqualTo(0)) && right.size.assert(strictEqualTo(0));
    });
  });

  suite("partitionMapWith", () => {
    test("partitions and maps with custom configs", () => {
      const bConfig       = HashEq.StructuralStrict;
      const cConfig       = HashEq.StructuralStrict;
      const [left, right] = HashSet.partitionMapWith(
        bConfig,
        cConfig,
      )((n: number) => (n % 2 === 0 ? Either.right(n.toString()) : Either.left(n)))(HashSet.make(1, 2, 3, 4));
      return (
        left.size.assert(strictEqualTo(2)) &&
        right.size.assert(strictEqualTo(2)) &&
        left.has(1).assert(isTrue) &&
        left.has(3).assert(isTrue) &&
        right.has("2").assert(isTrue) &&
        right.has("4").assert(isTrue)
      );
    });
  });

  suite("partitionMap", () => {
    test("partitions and maps", () => {
      const [left, right] = HashSet.make(1, 2, 3, 4).partitionMap((n) =>
        n % 2 === 0 ? Either.right(n.toString()) : Either.left(n),
      );
      return (
        left.size.assert(strictEqualTo(2)) &&
        right.size.assert(strictEqualTo(2)) &&
        left.has(1).assert(isTrue) &&
        left.has(3).assert(isTrue) &&
        right.has("2").assert(isTrue) &&
        right.has("4").assert(isTrue)
      );
    });

    test("handles all going left", () => {
      const [left, right] = HashSet.make(1, 2, 3).partitionMap((n) => Either.left(n));
      return left.size.assert(strictEqualTo(3)) && right.size.assert(strictEqualTo(0));
    });

    test("handles all going right", () => {
      const [left, right] = HashSet.make(1, 2, 3).partitionMap((n) => Either.right(n));
      return left.size.assert(strictEqualTo(0)) && right.size.assert(strictEqualTo(3));
    });

    test("works with empty set", () => {
      const [left, right] = HashSet.empty<number>().partitionMap((n) => Either.left(n));
      return left.size.assert(strictEqualTo(0)) && right.size.assert(strictEqualTo(0));
    });
  });

  suite("foldLeft", () => {
    test("folds over elements", () => {
      const result = HashSet.make(1, 2, 3).foldLeft(0, (acc, n) => acc + n);
      return result.assert(strictEqualTo(6));
    });

    test("works with empty set", () => {
      const result = HashSet.empty<number>().foldLeft(42, (acc, n) => acc + n);
      return result.assert(strictEqualTo(42));
    });

    test("folds with string accumulator", () => {
      const result = HashSet.make("a", "b", "c").foldLeft("", (acc, s) => acc + s);
      const chars  = result.split("").sort().join("");
      return chars.assert(strictEqualTo("abc"));
    });

    test("folds with transformation", () => {
      const result = HashSet.make(1, 2, 3).foldLeft(1, (acc, n) => acc * n);
      return result.assert(strictEqualTo(6));
    });
  });

  suite("join", () => {
    test("joins strings with separator", () => {
      const set    = HashSet.make("a", "b", "c");
      const result = set.join(", ");
      const parts  = result.split(", ").sort();
      return parts.assert(deepEqualTo(["a", "b", "c"]));
    });

    test("returns empty string for empty set", () => {
      return HashSet.empty<string>().join(", ").assert(strictEqualTo(""));
    });

    test("returns single element without separator", () => {
      return HashSet.make("hello").join(", ").assert(strictEqualTo("hello"));
    });

    test("joins with empty separator", () => {
      const set    = HashSet.make("a", "b");
      const result = set.join("");
      return result.assert(strictEqualTo("ab")) || result.assert(strictEqualTo("ba"));
    });
  });

  suite("difference", () => {
    test("removes elements present in other iterable", () => {
      const set = HashSet.make(1, 2, 3, 4, 5).difference([2, 4, 6]);
      return (
        set.size.assert(strictEqualTo(3)) &&
        set.has(1).assert(isTrue) &&
        set.has(2).assert(isFalse) &&
        set.has(3).assert(isTrue) &&
        set.has(4).assert(isFalse) &&
        set.has(5).assert(isTrue)
      );
    });

    test("handles non-existing elements in other", () => {
      const set = HashSet.make(1, 2, 3).difference([4, 5, 6]);
      return set.size.assert(strictEqualTo(3));
    });

    test("returns empty set when all elements removed", () => {
      const set = HashSet.make(1, 2, 3).difference([1, 2, 3]);
      return set.size.assert(strictEqualTo(0));
    });

    test("works with empty other", () => {
      const set = HashSet.make(1, 2, 3).difference([]);
      return set.size.assert(strictEqualTo(3));
    });
  });

  suite("every", () => {
    test("returns true when all elements match", () => {
      return HashSet.make(2, 4, 6)
        .every((n) => n % 2 === 0)
        .assert(isTrue);
    });

    test("returns false when some elements don't match", () => {
      return HashSet.make(1, 2, 3)
        .every((n) => n % 2 === 0)
        .assert(isFalse);
    });

    test("returns true for empty set", () => {
      return HashSet.empty<number>()
        .every(() => false)
        .assert(isTrue);
    });
  });

  suite("intersection", () => {
    test("returns common elements", () => {
      const set = HashSet.make(1, 2, 3, 4).intersection([2, 3, 5]);
      return set.size.assert(strictEqualTo(2)) && set.has(2).assert(isTrue) && set.has(3).assert(isTrue);
    });

    test("returns empty set when no common elements", () => {
      const set = HashSet.make(1, 2, 3).intersection([4, 5, 6]);
      return set.size.assert(strictEqualTo(0));
    });

    test("returns all elements when all common", () => {
      const set = HashSet.make(1, 2, 3).intersection([1, 2, 3, 4, 5]);
      return set.size.assert(strictEqualTo(3));
    });

    test("works with empty set", () => {
      const set = HashSet.empty<number>().intersection([1, 2, 3]);
      return set.size.assert(strictEqualTo(0));
    });
  });

  suite("isSubset", () => {
    test("returns true when all elements are in other set", () => {
      const subset   = HashSet.make(1, 2);
      const superset = HashSet.make(1, 2, 3, 4);
      return subset.isSubset(superset).assert(isTrue);
    });

    test("returns false when some elements are not in other set", () => {
      const subset   = HashSet.make(1, 2, 5);
      const superset = HashSet.make(1, 2, 3, 4);
      return subset.isSubset(superset).assert(isFalse);
    });

    test("returns true for identical sets", () => {
      const set1 = HashSet.make(1, 2, 3);
      const set2 = HashSet.make(1, 2, 3);
      return set1.isSubset(set2).assert(isTrue);
    });

    test("returns true for empty set", () => {
      return HashSet.empty<number>()
        .isSubset(HashSet.make(1, 2, 3))
        .assert(isTrue);
    });
  });

  suite("some", () => {
    test("returns true when at least one element matches", () => {
      return HashSet.make(1, 2, 3, 4)
        .some((n) => n % 2 === 0)
        .assert(isTrue);
    });

    test("returns false when no elements match", () => {
      return HashSet.make(1, 3, 5)
        .some((n) => n % 2 === 0)
        .assert(isFalse);
    });

    test("returns false for empty set", () => {
      return HashSet.empty<number>()
        .some(() => true)
        .assert(isFalse);
    });
  });

  suite("union", () => {
    test("combines elements from both sets", () => {
      const set = HashSet.make(1, 2, 3).union([3, 4, 5]);
      return (
        set.size.assert(strictEqualTo(5)) &&
        set.has(1).assert(isTrue) &&
        set.has(2).assert(isTrue) &&
        set.has(3).assert(isTrue) &&
        set.has(4).assert(isTrue) &&
        set.has(5).assert(isTrue)
      );
    });

    test("handles overlapping elements", () => {
      const set = HashSet.make(1, 2, 3).union([1, 2, 3]);
      return set.size.assert(strictEqualTo(3));
    });

    test("handles empty other", () => {
      const set = HashSet.make(1, 2, 3).union([]);
      return set.size.assert(strictEqualTo(3));
    });

    test("handles empty self", () => {
      const set = HashSet.empty<number>().union([1, 2, 3]);
      return set.size.assert(strictEqualTo(3));
    });
  });

  suite("toArray", () => {
    test("returns sorted array", () => {
      const set = HashSet.make(3, 1, 2);
      const arr = set.toArray(Number.Ord);
      return arr.assert(deepEqualTo([1, 2, 3]));
    });

    test("returns empty array for empty set", () => {
      const arr = HashSet.empty<number>().toArray(Number.Ord);
      return arr.assert(deepEqualTo([] as Array<number>));
    });

    test("returns sorted string array", () => {
      const set = HashSet.make("c", "a", "b");
      const arr = set.toArray(String.Ord);
      return arr.assert(deepEqualTo(["a", "b", "c"]));
    });
  });
});
