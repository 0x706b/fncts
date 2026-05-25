import type {} from "@fncts/base/collection/Iterable";

import { isJust } from "@fncts/test/control/Assertion";

suite("Iterable", () => {
  suite("constructors", () => {
    test("make", () => {
      const iterable = Iterable.make<number>(() => {
        let i = 0;
        return {
          next() {
            return i < 3 ? { done: false, value: i++ } : { done: true, value: undefined };
          },
        };
      });
      return iterable.toArray.assert(deepEqualTo([0, 1, 2]));
    });

    test("empty", () => {
      return Iterable.empty<number>().toArray.assert(deepEqualTo([]));
    });

    test("single", () => {
      return Iterable.single(42).toArray.assert(deepEqualTo([42]));
    });

    test("makeBy", () => {
      return Iterable.makeBy(3, (i) => i * 2).toArray.assert(deepEqualTo([0, 2, 4]));
    });

    test("range", () => {
      return Iterable.range(1, 4).toArray.assert(deepEqualTo([1, 2, 3, 4]));
    });

    test("range single", () => {
      return Iterable.range(5, 5).toArray.assert(deepEqualTo([5]));
    });

    test("replicate", () => {
      return Iterable.replicate(3, "a").toArray.assert(deepEqualTo(["a", "a", "a"]));
    });
  });

  suite("toArray", () => {
    test("from array", () => {
      return [1, 2, 3].toIterable.toArray.assert(deepEqualTo([1, 2, 3]));
    });

    test("empty", () => {
      return [].toIterable.toArray.assert(deepEqualTo([]));
    });
  });

  suite("toIterable", () => {
    test("returns self", () => {
      const arr = [1, 2, 3];
      return arr.toIterable.assert(strictEqualTo(arr));
    });
  });

  suite("isEmpty", () => {
    test("empty array", () => {
      return [].toIterable.isEmpty.assert(isTrue);
    });

    test("non-empty array", () => {
      return [1].toIterable.isEmpty.assert(isFalse);
    });

    test("plain empty iterable", () => {
      return Iterable.empty<number>().isEmpty.assert(isTrue);
    });
  });

  suite("isNonEmpty", () => {
    test("empty array", () => {
      return [].toIterable.isNonEmpty.assert(isFalse);
    });

    test("non-empty array", () => {
      return [1].toIterable.isNonEmpty.assert(isTrue);
    });

    test("plain empty iterable", () => {
      return Iterable.empty<number>().isNonEmpty.assert(isFalse);
    });
  });

  suite("intrinsicSize", () => {
    test("array with length", () => {
      return [1, 2, 3].toIterable.intrinsicSize.assert(isJust(strictEqualTo(3)));
    });

    test("empty array", () => {
      return [].toIterable.intrinsicSize.assert(isJust(strictEqualTo(0)));
    });

    test("plain iterable", () => {
      const iterable = Iterable.make<number>(() => [1, 2][Symbol.iterator]());
      return iterable.intrinsicSize.assert(strictEqualTo(Nothing()));
    });
  });

  suite("size", () => {
    test("array", () => {
      return [1, 2, 3].toIterable.size.assert(strictEqualTo(3));
    });

    test("empty", () => {
      return [].toIterable.size.assert(strictEqualTo(0));
    });

    test("plain iterable", () => {
      const iterable = Iterable.make<number>(() => [1, 2, 3][Symbol.iterator]());
      return iterable.size.assert(strictEqualTo(3));
    });
  });

  suite("sum", () => {
    test("non-empty", () => {
      return [1, 2, 3].toIterable.sum.assert(strictEqualTo(6));
    });

    test("empty", () => {
      return [].toIterable.sum.assert(strictEqualTo(0));
    });

    test("negative numbers", () => {
      return [1, -2, 3].toIterable.sum.assert(strictEqualTo(2));
    });
  });

  suite("map", () => {
    test("non-empty", () => {
      return [1, 2, 3].toIterable.map((n) => n * 2).toArray.assert(deepEqualTo([2, 4, 6]));
    });

    test("empty", () => {
      return ([] as Array<number>).toIterable.map((n) => n * 2).toArray.assert(deepEqualTo([]));
    });

    test("type change", () => {
      return [1, 2, 3].toIterable.map((n) => n.toString()).toArray.assert(deepEqualTo(["1", "2", "3"]));
    });
  });

  suite("mapWithIndex", () => {
    test("non-empty", () => {
      return ["a", "b"].toIterable.mapWithIndex((i, s) => `${i}:${s}`).toArray.assert(deepEqualTo(["0:a", "1:b"]));
    });

    test("empty", () => {
      return ([] as Array<string>).toIterable.mapWithIndex((i, s) => `${i}:${s}`).toArray.assert(deepEqualTo([]));
    });
  });

  suite("flatMap", () => {
    test("non-empty", () => {
      return [1, 2].toIterable.flatMap((n) => [n, n + 1].toIterable).toArray.assert(deepEqualTo([1, 2, 2, 3]));
    });

    test("to empty", () => {
      return [1, 2].toIterable.flatMap(() => Iterable.empty<number>()).toArray.assert(deepEqualTo([]));
    });

    test("empty", () => {
      return ([] as Array<number>).toIterable.flatMap((n) => [n, n].toIterable).toArray.assert(deepEqualTo([]));
    });
  });

  suite("ap", () => {
    test("functions and values", () => {
      const fns  = [(x: number) => x + 1, (x: number) => x * 2].toIterable;
      const vals = [1, 2].toIterable;
      return fns.ap(vals).toArray.assert(deepEqualTo([2, 3, 2, 4]));
    });

    test("empty functions", () => {
      const fns  = ([] as Array<(x: number) => number>).toIterable;
      const vals = [1, 2].toIterable;
      return fns.ap(vals).toArray.assert(deepEqualTo([]));
    });

    test("empty values", () => {
      const fns  = [(x: number) => x + 1].toIterable;
      const vals = ([] as Array<number>).toIterable;
      return fns.ap(vals).toArray.assert(deepEqualTo([]));
    });
  });

  suite("crossWith", () => {
    test("cartesian product", () => {
      return [1, 2].toIterable
        .crossWith([10, 20].toIterable, (a, b) => a + b)
        .toArray.assert(deepEqualTo([11, 21, 12, 22]));
    });

    test("empty left", () => {
      return ([] as Array<number>).toIterable
        .crossWith([1, 2].toIterable, (a, b) => a + b)
        .toArray.assert(deepEqualTo([]));
    });

    test("empty right", () => {
      return [1, 2].toIterable
        .crossWith(([] as Array<number>).toIterable, (a, b) => a + b)
        .toArray.assert(deepEqualTo([]));
    });
  });

  suite("filter", () => {
    test("some match", () => {
      return [1, 2, 3, 4].toIterable.filter((n) => n % 2 === 0).toArray.assert(deepEqualTo([2, 4]));
    });

    test("all match", () => {
      return [2, 4, 6].toIterable.filter((n) => n % 2 === 0).toArray.assert(deepEqualTo([2, 4, 6]));
    });

    test("none match", () => {
      return [1, 3, 5].toIterable.filter((n) => n % 2 === 0).toArray.assert(deepEqualTo([]));
    });

    test("empty", () => {
      return ([] as Array<number>).toIterable.filter((n) => n % 2 === 0).toArray.assert(deepEqualTo([]));
    });
  });

  suite("filterWithIndex", () => {
    test("even indices", () => {
      return ["a", "b", "c", "d"].toIterable
        .filterWithIndex((i, _) => i % 2 === 0)
        .toArray.assert(deepEqualTo(["a", "c"]));
    });

    test("empty", () => {
      return ([] as Array<string>).toIterable.filterWithIndex((i, _) => i % 2 === 0).toArray.assert(deepEqualTo([]));
    });
  });

  suite("filterMap", () => {
    test("some just", () => {
      return [1, 2, 3, 4].toIterable
        .filterMap((n) => (n % 2 === 0 ? Just(n.toString()) : Nothing()))
        .toArray.assert(deepEqualTo(["2", "4"]));
    });

    test("all nothing", () => {
      return [1, 3, 5].toIterable.filterMap(() => Nothing()).toArray.assert(deepEqualTo([]));
    });

    test("empty", () => {
      return ([] as Array<number>).toIterable.filterMap((n) => Just(n)).toArray.assert(deepEqualTo([]));
    });
  });

  suite("filterMapWithIndex", () => {
    test("even indices", () => {
      return ["a", "b", "c"].toIterable
        .filterMapWithIndex((i, s) => (i % 2 === 0 ? Just(s.toUpperCase()) : Nothing()))
        .toArray.assert(deepEqualTo(["A", "C"]));
    });

    test("empty", () => {
      return ([] as Array<string>).toIterable.filterMapWithIndex((i, s) => Just(s)).toArray.assert(deepEqualTo([]));
    });
  });

  suite("concat", () => {
    test("both non-empty", () => {
      return [1, 2].toIterable.concat([3, 4].toIterable).toArray.assert(deepEqualTo([1, 2, 3, 4]));
    });

    test("empty left", () => {
      return ([] as Array<number>).toIterable.concat([1, 2].toIterable).toArray.assert(deepEqualTo([1, 2]));
    });

    test("empty right", () => {
      return [1, 2].toIterable.concat(([] as Array<number>).toIterable).toArray.assert(deepEqualTo([1, 2]));
    });

    test("both empty", () => {
      return ([] as Array<number>).toIterable.concat(([] as Array<number>).toIterable).toArray.assert(deepEqualTo([]));
    });
  });

  suite("append", () => {
    test("non-empty", () => {
      return [1, 2].toIterable.append(3).toArray.assert(deepEqualTo([1, 2, 3]));
    });

    test("empty", () => {
      return ([] as Array<number>).toIterable.append(1).toArray.assert(deepEqualTo([1]));
    });
  });

  suite("zipWith", () => {
    test("same length", () => {
      return [1, 2].toIterable.zipWith([10, 20].toIterable, (a, b) => a + b).toArray.assert(deepEqualTo([11, 22]));
    });

    test("left shorter", () => {
      return [1].toIterable.zipWith([10, 20].toIterable, (a, b) => a + b).toArray.assert(deepEqualTo([11]));
    });

    test("right shorter", () => {
      return [1, 2].toIterable.zipWith([10].toIterable, (a, b) => a + b).toArray.assert(deepEqualTo([11]));
    });

    test("both empty", () => {
      return ([] as Array<number>).toIterable
        .zipWith(([] as Array<number>).toIterable, (a, b) => a + b)
        .toArray.assert(deepEqualTo([]));
    });
  });

  suite("zipWithIndex", () => {
    test("non-empty", () => {
      return ["a", "b", "c"].toIterable.zipWithIndex.toArray.assert(
        deepEqualTo([
          [0, "a"],
          [1, "b"],
          [2, "c"],
        ]),
      );
    });

    test("empty", () => {
      return ([] as Array<string>).toIterable.zipWithIndex.toArray.assert(deepEqualTo([]));
    });
  });

  suite("take", () => {
    test("some", () => {
      return [1, 2, 3, 4].toIterable.take(2).toArray.assert(deepEqualTo([1, 2]));
    });

    test("zero", () => {
      return [1, 2, 3].toIterable.take(0).toArray.assert(deepEqualTo([]));
    });

    test("more than length", () => {
      return [1, 2].toIterable.take(5).toArray.assert(deepEqualTo([1, 2]));
    });

    test("from empty", () => {
      return ([] as Array<number>).toIterable.take(3).toArray.assert(deepEqualTo([]));
    });
  });

  suite("every", () => {
    test("all match", () => {
      return [2, 4, 6].toIterable.every((n) => n % 2 === 0).assert(isTrue);
    });

    test("some miss", () => {
      return [2, 3, 6].toIterable.every((n) => n % 2 === 0).assert(isFalse);
    });

    test("empty", () => {
      return ([] as Array<number>).toIterable.every(() => false).assert(isTrue);
    });
  });

  suite("everyWithIndex", () => {
    test("match", () => {
      return [0, 2, 4].toIterable.everyWithIndex((i, n) => n === i * 2).assert(isTrue);
    });

    test("miss", () => {
      return [0, 2, 5].toIterable.everyWithIndex((i, n) => n === i * 2).assert(isFalse);
    });

    test("empty", () => {
      return ([] as Array<number>).toIterable.everyWithIndex(() => false).assert(isTrue);
    });
  });

  suite("find", () => {
    test("match", () => {
      return [1, 2, 3].toIterable.find((n) => n === 2).assert(strictEqualTo(Just(2)));
    });

    test("no match", () => {
      return [1, 2, 3].toIterable.find((n) => n === 5).assert(strictEqualTo(Nothing()));
    });

    test("empty", () => {
      return ([] as Array<number>).toIterable.find((n) => n === 1).assert(strictEqualTo(Nothing()));
    });
  });

  suite("findIndex", () => {
    test("match", () => {
      return [1, 2, 3].toIterable.findIndex((n) => n === 2).assert(strictEqualTo(1));
    });

    test("no match", () => {
      return [1, 2, 3].toIterable.findIndex((n) => n === 5).assert(strictEqualTo(-1));
    });

    test("empty", () => {
      return ([] as Array<number>).toIterable.findIndex((n) => n === 1).assert(strictEqualTo(-1));
    });
  });

  suite("corresponds", () => {
    test("equal", () => {
      return [1, 2, 3].toIterable.corresponds([1, 2, 3], (a, b) => a === b).assert(isTrue);
    });

    test("different values", () => {
      return [1, 2, 3].toIterable.corresponds([1, 2, 4], (a, b) => a === b).assert(isFalse);
    });

    test("different lengths", () => {
      return [1, 2, 3].toIterable.corresponds([1, 2].toIterable, (a, b) => a === b).assert(isFalse);
    });

    test("empty", () => {
      return ([] as Array<number>).toIterable
        .corresponds(([] as Array<number>).toIterable, (a, b) => a === b)
        .assert(isTrue);
    });
  });

  suite("foldLeft", () => {
    test("sum", () => {
      return [1, 2, 3].toIterable.foldLeft(0, (acc, n) => acc + n).assert(strictEqualTo(6));
    });

    test("empty", () => {
      return ([] as Array<number>).toIterable.foldLeft(0, (acc, n) => acc + n).assert(strictEqualTo(0));
    });

    test("string concat", () => {
      return ["a", "b", "c"].toIterable.foldLeft("", (acc, s) => acc + s).assert(strictEqualTo("abc"));
    });
  });

  suite("foldLeftWithIndex", () => {
    test("sum with index", () => {
      return [1, 2, 3].toIterable.foldLeftWithIndex(0, (i, acc, n) => acc + n + i).assert(strictEqualTo(9));
    });

    test("empty", () => {
      return ([] as Array<number>).toIterable.foldLeftWithIndex(0, (i, acc, n) => acc + n + i).assert(strictEqualTo(0));
    });
  });

  suite("foldRight", () => {
    test("sum", () => {
      const result = [1, 2, 3].toIterable.foldRight(Eval.now(0), (a, eb) => Eval.now(a + eb.run));
      return result.run.assert(strictEqualTo(6));
    });

    test("empty", () => {
      const result = ([] as Array<number>).toIterable.foldRight(Eval.now(0), (a, eb) => Eval.now(a + eb.run));
      return result.run.assert(strictEqualTo(0));
    });

    test("string concat", () => {
      const result = ["a", "b", "c"].toIterable.foldRight(Eval.now(""), (a, eb) => Eval.now(a + eb.run));
      return result.run.assert(strictEqualTo("abc"));
    });
  });

  suite("foldRightWithIndex", () => {
    test("sum with index", () => {
      const result = [1, 2, 3].toIterable.foldRightWithIndex(Eval.now(0), (i, a, eb) => Eval.now(a + i + eb.run));
      return result.run.assert(strictEqualTo(9));
    });

    test("empty", () => {
      const result = ([] as Array<number>).toIterable.foldRightWithIndex(Eval.now(0), (i, a, eb) =>
        Eval.now(a + i + eb.run),
      );
      return result.run.assert(strictEqualTo(0));
    });
  });

  suite("foldMap", () => {
    test("string concat", () => {
      return ["a", "b", "c"].toIterable.foldMap((s) => s.toUpperCase()).assert(strictEqualTo("ABC"));
    });

    test("empty", () => {
      return ([] as Array<string>).toIterable.foldMap((s) => s.toUpperCase()).assert(strictEqualTo(""));
    });
  });

  suite("foldMapWithIndex", () => {
    test("string concat with index", () => {
      return ["a", "b", "c"].toIterable.foldMapWithIndex((i, s) => `${i}${s}`).assert(strictEqualTo("0a1b2c"));
    });

    test("empty", () => {
      return ([] as Array<string>).toIterable.foldMapWithIndex((i, s) => `${i}${s}`).assert(strictEqualTo(""));
    });
  });

  suite("partition", () => {
    test("some match", () => {
      const [fails, passes] = [1, 2, 3, 4].toIterable.partition((n) => n % 2 === 0);
      return fails.toArray.assert(deepEqualTo([1, 3])) && passes.toArray.assert(deepEqualTo([2, 4]));
    });

    test("all match", () => {
      const [fails, passes] = [2, 4, 6].toIterable.partition((n) => n % 2 === 0);
      return fails.toArray.assert(deepEqualTo([])) && passes.toArray.assert(deepEqualTo([2, 4, 6]));
    });

    test("none match", () => {
      const [fails, passes] = [1, 3, 5].toIterable.partition((n) => n % 2 === 0);
      return fails.toArray.assert(deepEqualTo([1, 3, 5])) && passes.toArray.assert(deepEqualTo([]));
    });

    test("empty", () => {
      const [fails, passes] = ([] as Array<number>).toIterable.partition((n) => n % 2 === 0);
      return fails.toArray.assert(deepEqualTo([])) && passes.toArray.assert(deepEqualTo([]));
    });
  });

  suite("partitionWithIndex", () => {
    test("even indices", () => {
      const [fails, passes] = ["a", "b", "c"].toIterable.partitionWithIndex((i, _) => i % 2 === 0);
      return fails.toArray.assert(deepEqualTo(["b"])) && passes.toArray.assert(deepEqualTo(["a", "c"]));
    });
  });

  suite("partitionMap", () => {
    test("mixed", () => {
      const [lefts, rights] = [1, 2, 3, 4].toIterable.partitionMap((n) =>
        n % 2 === 0 ? Either.right(n) : Either.left(n),
      );
      return lefts.toArray.assert(deepEqualTo([1, 3])) && rights.toArray.assert(deepEqualTo([2, 4]));
    });

    test("all left", () => {
      const [lefts, rights] = [1, 3].toIterable.partitionMap((n) => Either.left(n));
      return lefts.toArray.assert(deepEqualTo([1, 3])) && rights.toArray.assert(deepEqualTo([]));
    });

    test("all right", () => {
      const [lefts, rights] = [2, 4].toIterable.partitionMap((n) => Either.right(n));
      return lefts.toArray.assert(deepEqualTo([])) && rights.toArray.assert(deepEqualTo([2, 4]));
    });

    test("empty", () => {
      const [lefts, rights] = ([] as Array<number>).toIterable.partitionMap((n) => Either.right(n));
      return lefts.toArray.assert(deepEqualTo([])) && rights.toArray.assert(deepEqualTo([]));
    });
  });

  suite("partitionMapWithIndex", () => {
    test("even indices", () => {
      const [lefts, rights] = ["a", "b", "c"].toIterable.partitionMapWithIndex((i, s) =>
        i % 2 === 0 ? Either.right(s.toUpperCase()) : Either.left(s),
      );
      return lefts.toArray.assert(deepEqualTo(["b"])) && rights.toArray.assert(deepEqualTo(["A", "C"]));
    });
  });

  suite("traverseToConc", () => {
    test("all Just", () => {
      const result = [1, 2, 3].toIterable.traverseToConc(Maybe.Applicative)((n) => Just(n * 2));
      return result.assert(isJust(strictEqualTo(Conc(2, 4, 6))));
    });

    test("Nothing short-circuits", () => {
      const result = [1, 2, 3].toIterable.traverseToConc(Maybe.Applicative)((n) => (n === 2 ? Nothing() : Just(n)));
      return result.assert(strictEqualTo(Nothing()));
    });

    test("empty", () => {
      const result = ([] as Array<number>).toIterable.traverseToConc(Maybe.Applicative)((n) => Just(n));
      return result.assert(isJust(strictEqualTo(Conc.empty<number>())));
    });
  });

  suite("traverseToConcWithIndex", () => {
    test("with index", () => {
      const result = [1, 2, 3].toIterable.traverseToConcWithIndex(Maybe.Applicative)((i, n) => Just(i + n));
      return result.assert(isJust(strictEqualTo(Conc(1, 3, 5))));
    });

    test("Nothing", () => {
      const result = [1, 2, 3].toIterable.traverseToConcWithIndex(Maybe.Applicative)((i, n) =>
        i === 1 ? Nothing() : Just(n),
      );
      return result.assert(strictEqualTo(Nothing()));
    });
  });

  suite("property-based", () => {
    test.io(
      "map identity",
      Gen.int.array.check((as) => {
        const iterable = as.toIterable;
        return iterable.map((x) => x).toArray.assert(deepEqualTo(iterable.toArray));
      }),
    );

    test.io(
      "filter all true preserves elements",
      Gen.int.array.check((as) => {
        const iterable = as.toIterable;
        return iterable.filter(() => true).toArray.assert(deepEqualTo(iterable.toArray));
      }),
    );

    test.io(
      "foldLeft sum matches array",
      Gen.int.array.check((as) => {
        const iterableSum = as.toIterable.foldLeft(0, (acc, n) => acc + n);
        const arraySum    = as.foldLeft(0, (acc, n) => acc + n);
        return iterableSum.assert(strictEqualTo(arraySum));
      }),
    );

    test.io(
      "concat toArray is concatenation",
      Gen.int.array.zip(Gen.int.array).check(([as, bs]) => {
        const actual   = as.toIterable.concat(bs.toIterable).toArray;
        const expected = as.concat(bs);
        return actual.assert(deepEqualTo(expected));
      }),
      { timeout: 10_000 },
    );

    test.io(
      "take n then toArray is slice",
      Gen.int.array.check((as) => {
        const n        = Math.min(3, as.length);
        const actual   = as.toIterable.take(n).toArray;
        const expected = as.slice(0, n);
        return actual.assert(deepEqualTo(expected));
      }),
    );

    test.io(
      "filter all false gives empty",
      Gen.int.array.check((as) => {
        return as.toIterable.filter(() => false).isEmpty.assert(isTrue);
      }),
    );

    test.io(
      "size matches array length",
      Gen.int.array.check((as) => {
        return as.toIterable.size.assert(strictEqualTo(as.length));
      }),
    );

    test.io(
      "flatMap then map commutes",
      Gen.int.array.check((as) => {
        const actual   = as.toIterable.flatMap((n) => [n, n].toIterable).map((n) => n + 1).toArray;
        const expected = as.toIterable.flatMap((n) => [n + 1, n + 1].toIterable).toArray;
        return actual.assert(deepEqualTo(expected));
      }),
    );
  });
});
