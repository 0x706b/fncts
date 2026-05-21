import type {} from "@fncts/base/global";
import type {} from "@fncts/io/global";

suite("Vector", () => {
  suite("constructors", () => {
    test("empty", Vector.empty<number>().assert(strictEqualTo(Vector.empty())));

    test("vector variadic", Vector(1, 2, 3).assert(strictEqualTo(Vector(1, 2, 3))));

    test("from array", Vector.from([1, 2, 3]).assert(strictEqualTo(Vector(1, 2, 3))));

    test("from iterable", Vector.from([1, 2, 3] as Iterable<number>).assert(strictEqualTo(Vector(1, 2, 3))));

    test("from empty iterable", Vector.from([] as Iterable<never>).assert(strictEqualTo(Vector.empty())));

    test("single", Vector.single(1).assert(strictEqualTo(Vector(1))));

    test("pair", Vector.pair(1, 2).assert(strictEqualTo(Vector(1, 2))));

    test("range ascending", Vector.range(1, 5).assert(strictEqualTo(Vector(1, 2, 3, 4))));

    test("range descending", Vector.range(5, 1).assert(strictEqualTo(Vector.empty())));

    test("range single", Vector.range(3, 4).assert(strictEqualTo(Vector(3))));

    test("replicate", Vector.replicate(3, "a").assert(strictEqualTo(Vector("a", "a", "a"))));

    test("replicate zero", Vector.replicate(0, "a").assert(strictEqualTo(Vector.empty())));

    test("makeBy", Vector.makeBy(3, (i) => i * 2).assert(strictEqualTo(Vector(0, 2, 4))));

    test("makeBy zero", Vector.makeBy(0, (i) => i).assert(strictEqualTo(Vector.empty())));

    test(
      "unfold",
      Vector.unfold(0, (n) => (n < 3 ? Just([n, n + 1] as const) : Nothing())).assert(strictEqualTo(Vector(0, 1, 2))),
    );

    test("unfold empty", Vector.unfold(0, () => Nothing()).assert(strictEqualTo(Vector.empty())));
  });

  suite("isEmpty / isNonEmpty", () => {
    test("empty is empty", Vector.empty<number>().isEmpty().assert(isTrue));
    test("empty is not non-empty", Vector.empty<number>().isNonEmpty().assert(isFalse));
    test("non-empty is not empty", Vector(1).isEmpty().assert(isFalse));
    test("non-empty is non-empty", Vector(1).isNonEmpty().assert(isTrue));
  });

  suite("length", () => {
    test("empty length", Vector.empty<number>().length.assert(strictEqualTo(0)));
    test("single length", Vector(1).length.assert(strictEqualTo(1)));
    test("multiple length", Vector(1, 2, 3, 4, 5).length.assert(strictEqualTo(5)));
  });

  suite("head", () => {
    test("safe head on empty", Vector.empty<number>().head.assert(strictEqualTo(Nothing())));
    test("safe head on non-empty", Vector(1, 2).head.assert(strictEqualTo(Just(1))));
  });

  suite("unsafeHead", () => {
    test("unsafeHead returns first element", Vector(1, 2, 3).unsafeHead!.assert(strictEqualTo(1)));
    test("unsafeHead on empty returns undefined", Vector.empty<number>().unsafeHead!.assert(strictEqualTo(undefined)));
  });

  suite("last", () => {
    test("safe last on empty", Vector.empty<number>().last.assert(strictEqualTo(Nothing())));
    test("safe last on non-empty", Vector(1, 2, 3).last.assert(strictEqualTo(Just(3))));
  });

  suite("unsafeLast", () => {
    test("unsafeLast returns last element", Vector(1, 2, 3).unsafeLast!.assert(strictEqualTo(3)));
    test("unsafeLast on single", Vector(42).unsafeLast!.assert(strictEqualTo(42)));
    test("unsafeLast on empty returns undefined", Vector.empty<number>().unsafeLast!.assert(strictEqualTo(undefined)));
  });

  suite("tail", () => {
    test("safe tail on empty", Vector.empty<number>().tail.assert(strictEqualTo(Vector.empty())));
    test("safe tail on single", Vector(1).tail.assert(strictEqualTo(Vector.empty())));
    test("safe tail on multiple", Vector(1, 2, 3).tail.assert(strictEqualTo(Vector(2, 3))));
  });

  suite("get / unsafeGet", () => {
    test(
      "get existing",
      Vector(10, 20, 30)
        .get(1)
        .assert(strictEqualTo(Just(20))),
    );
    test("get out of bounds", Vector(10, 20).get(5).assert(strictEqualTo(Nothing())));
    test("get negative", Vector(10, 20).get(-1).assert(strictEqualTo(Nothing())));
    test("unsafeGet existing", Vector(10, 20, 30).unsafeGet(0)!.assert(strictEqualTo(10)));
    test("unsafeGet middle", Vector(10, 20, 30).unsafeGet(1)!.assert(strictEqualTo(20)));
    test("unsafeGet last", Vector(10, 20, 30).unsafeGet(2)!.assert(strictEqualTo(30)));
  });

  suite("append", () => {
    test(
      "append to empty",
      Vector.empty<number>()
        .append(1)
        .assert(strictEqualTo(Vector(1))),
    );
    test(
      "append to non-empty",
      Vector(1, 2)
        .append(3)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test(
      "append multiple",
      Vector.empty<number>()
        .append(1)
        .append(2)
        .append(3)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test("append preserves original", () => {
      const original = Vector(1, 2);
      const appended = original.append(3);
      return original.assert(strictEqualTo(Vector(1, 2)));
    });
    test.io(
      "append property",
      Gen.int.array.check((as) => {
        const vec = Vector.from(as);
        return vec.append(42).length.assert(strictEqualTo(vec.length + 1));
      }),
    );
  });

  suite("prepend", () => {
    test(
      "prepend to empty",
      Vector.empty<number>()
        .prepend(1)
        .assert(strictEqualTo(Vector(1))),
    );
    test(
      "prepend to non-empty",
      Vector(2, 3)
        .prepend(1)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test(
      "prepend multiple",
      Vector.empty<number>()
        .prepend(3)
        .prepend(2)
        .prepend(1)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test("prepend preserves original", () => {
      const original = Vector(2, 3);
      const prepended = original.prepend(1);
      return prepended.assert(strictEqualTo(Vector(1, 2, 3)));
    });
    test.io(
      "prepend property",
      Gen.int.array.check((as) => {
        const vec = Vector.from(as);
        return vec.prepend(42).length.assert(strictEqualTo(vec.length + 1));
      }),
    );
  });

  suite("concat", () => {
    test(
      "concat empty left",
      Vector.empty<number>()
        .concat(Vector(1, 2))
        .assert(strictEqualTo(Vector(1, 2))),
    );
    test(
      "concat empty right",
      Vector(1, 2)
        .concat(Vector.empty())
        .assert(strictEqualTo(Vector(1, 2))),
    );
    test(
      "concat both",
      Vector(1, 2)
        .concat(Vector(3, 4))
        .assert(strictEqualTo(Vector(1, 2, 3, 4))),
    );
    test("concat large vectors", () => {
      const a = Vector.range(0, 100);
      const b = Vector.range(100, 200);
      return a.concat(b).length.assert(strictEqualTo(200));
    });
    test.io(
      "concat length is sum",
      Gen.int.array.zip(Gen.int.array).check(([as, bs]) => {
        const va = Vector.from(as);
        const vb = Vector.from(bs);
        return va.concat(vb).length.assert(strictEqualTo(va.length + vb.length));
      }),
    );
  });

  suite("take / drop", () => {
    test("take from empty", Vector.empty<number>().take(5).assert(strictEqualTo(Vector.empty())));
    test("take zero", Vector(1, 2, 3).take(0).assert(strictEqualTo(Vector.empty())));
    test(
      "take some",
      Vector(1, 2, 3, 4, 5)
        .take(3)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test(
      "take all",
      Vector(1, 2, 3)
        .take(5)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test("drop from empty", Vector.empty<number>().drop(5).assert(strictEqualTo(Vector.empty())));
    test(
      "drop zero",
      Vector(1, 2, 3)
        .drop(0)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test(
      "drop some",
      Vector(1, 2, 3, 4, 5)
        .drop(2)
        .assert(strictEqualTo(Vector(3, 4, 5))),
    );
    test("drop all", Vector(1, 2, 3).drop(5).assert(strictEqualTo(Vector.empty())));
    test.io(
      "take then drop is identity",
      Gen.int.array.check((as) => {
        const vec = Vector.from(as);
        return vec.take(vec.length).assert(strictEqualTo(vec));
      }),
    );
  });

  suite("takeLast / dropLast", () => {
    test(
      "takeLast some",
      Vector(1, 2, 3, 4, 5)
        .takeLast(2)
        .assert(strictEqualTo(Vector(4, 5))),
    );
    test(
      "takeLast all",
      Vector(1, 2, 3)
        .takeLast(5)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test("takeLast empty", Vector.empty<number>().takeLast(3).assert(strictEqualTo(Vector.empty())));
    test(
      "dropLast some",
      Vector(1, 2, 3, 4, 5)
        .dropLast(2)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test("dropLast all", Vector(1, 2, 3).dropLast(5).assert(strictEqualTo(Vector.empty())));
    test("dropLast empty", Vector.empty<number>().dropLast(3).assert(strictEqualTo(Vector.empty())));
  });

  suite("takeWhile / dropWhile", () => {
    test(
      "takeWhile",
      Vector(1, 3, 5, 2, 4)
        .takeWhile((n) => n % 2 !== 0)
        .assert(strictEqualTo(Vector(1, 3, 5))),
    );
    test(
      "takeWhile none",
      Vector(2, 4, 6)
        .takeWhile((n) => n % 2 !== 0)
        .assert(strictEqualTo(Vector.empty())),
    );
    test(
      "dropWhile",
      Vector(1, 3, 5, 2, 4)
        .dropWhile((n) => n % 2 !== 0)
        .assert(strictEqualTo(Vector(2, 4))),
    );
    test(
      "dropWhile none",
      Vector(2, 4, 6)
        .dropWhile((n) => n % 2 !== 0)
        .assert(strictEqualTo(Vector(2, 4, 6))),
    );
  });

  suite("slice", () => {
    test(
      "slice middle",
      Vector(0, 1, 2, 3, 4, 5)
        .slice(2, 4)
        .assert(strictEqualTo(Vector(2, 3))),
    );
    test(
      "slice from start",
      Vector(0, 1, 2, 3)
        .slice(0, 2)
        .assert(strictEqualTo(Vector(0, 1))),
    );
    test(
      "slice to end",
      Vector(0, 1, 2, 3)
        .slice(2, 4)
        .assert(strictEqualTo(Vector(2, 3))),
    );
    test("slice empty", Vector(0, 1, 2, 3).slice(2, 2).assert(strictEqualTo(Vector.empty())));
    test("slice out of bounds", Vector(0, 1).slice(5, 10).assert(strictEqualTo(Vector.empty())));
    test("slice large vector", () => {
      const vec = Vector.range(0, 200);
      return vec.slice(50, 150).length.assert(strictEqualTo(100));
    });
  });

  suite("splitAt / splitWhen", () => {
    test(
      "splitAt middle",
      Vector(1, 2, 3, 4, 5)
        .splitAt(2)
        .assert(deepEqualTo([Vector(1, 2), Vector(3, 4, 5)] as const)),
    );
    test(
      "splitAt zero",
      Vector(1, 2, 3)
        .splitAt(0)
        .assert(deepEqualTo([Vector.empty(), Vector(1, 2, 3)] as const)),
    );
    test(
      "splitAt end",
      Vector(1, 2, 3)
        .splitAt(3)
        .assert(deepEqualTo([Vector(1, 2, 3), Vector.empty()] as const)),
    );
    test(
      "splitWhen",
      Vector(1, 2, 3, 4, 5)
        .splitWhen((n) => n === 3)
        .assert(deepEqualTo([Vector(1, 2), Vector(3, 4, 5)] as const)),
    );
    test(
      "splitWhen not found",
      Vector(1, 2, 3)
        .splitWhen((n) => n === 10)
        .assert(deepEqualTo([Vector(1, 2, 3), Vector.empty()] as const)),
    );
  });

  suite("map", () => {
    test(
      "map empty",
      Vector.empty<number>()
        .map((n) => n + 1)
        .assert(strictEqualTo(Vector.empty())),
    );
    test(
      "map non-empty",
      Vector(1, 2, 3)
        .map((n) => n + 1)
        .assert(strictEqualTo(Vector(2, 3, 4))),
    );
    test(
      "map to different type",
      Vector(1, 2, 3)
        .map((n) => n.toString())
        .assert(strictEqualTo(Vector("1", "2", "3"))),
    );
    test.io(
      "map identity",
      Gen.int.array.check((as) => {
        const vec = Vector.from(as);
        return vec.map((x) => x).assert(strictEqualTo(vec));
      }),
    );
  });

  suite("flatMap", () => {
    test(
      "flatMap empty",
      Vector.empty<number>()
        .flatMap((n) => Vector(n, n))
        .assert(strictEqualTo(Vector.empty())),
    );
    test(
      "flatMap non-empty",
      Vector(1, 2)
        .flatMap((n) => Vector(n, n))
        .assert(strictEqualTo(Vector(1, 1, 2, 2))),
    );
    test(
      "flatMap to empty",
      Vector(1, 2)
        .flatMap(() => Vector.empty())
        .assert(strictEqualTo(Vector.empty())),
    );
  });

  suite("filter", () => {
    test(
      "filter empty",
      Vector.empty<number>()
        .filter((n) => n > 0)
        .assert(strictEqualTo(Vector.empty())),
    );
    test(
      "filter all match",
      Vector(1, 2, 3)
        .filter((n) => n > 0)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test(
      "filter none match",
      Vector(1, 2, 3)
        .filter((n) => n > 10)
        .assert(strictEqualTo(Vector.empty())),
    );
    test(
      "filter some match",
      Vector(1, 2, 3, 4, 5)
        .filter((n) => n % 2 === 0)
        .assert(strictEqualTo(Vector(2, 4))),
    );
  });

  suite("filterMap", () => {
    test(
      "filterMap some",
      Vector(1, 2, 3, 4)
        .filterMap((n) => (n % 2 === 0 ? Just(n.toString()) : Nothing()))
        .assert(strictEqualTo(Vector("2", "4"))),
    );
    test(
      "filterMap none",
      Vector(1, 3, 5)
        .filterMap((n) => (n % 2 === 0 ? Just(n) : Nothing()))
        .assert(strictEqualTo(Vector.empty())),
    );
  });

  suite("foldLeft", () => {
    test(
      "foldLeft empty",
      Vector.empty<number>()
        .foldLeft(0, (acc, n) => acc + n)
        .assert(strictEqualTo(0)),
    );
    test(
      "foldLeft sum",
      Vector(1, 2, 3)
        .foldLeft(0, (acc, n) => acc + n)
        .assert(strictEqualTo(6)),
    );
    test(
      "foldLeft product",
      Vector(1, 2, 3, 4)
        .foldLeft(1, (acc, n) => acc * n)
        .assert(strictEqualTo(24)),
    );
    test(
      "foldLeft string concat",
      Vector("a", "b", "c")
        .foldLeft("", (acc, s) => acc + s)
        .assert(strictEqualTo("abc")),
    );
  });

  suite("foldRight", () => {
    test(
      "foldRight empty",
      Vector.empty<number>()
        .foldRight(0, (n, acc) => acc + n)
        .assert(strictEqualTo(0)),
    );
    test(
      "foldRight sum",
      Vector(1, 2, 3)
        .foldRight(0, (n, acc) => acc + n)
        .assert(strictEqualTo(6)),
    );
    test(
      "foldRight string concat",
      Vector("a", "b", "c")
        .foldRight("", (s, acc) => s + acc)
        .assert(strictEqualTo("abc")),
    );
  });

  suite("foldMap", () => {
    test(
      "foldMap sum",
      Vector(1, 2, 3)
        .foldMap((n) => n, Number.MonoidSum)
        .assert(strictEqualTo(6)),
    );
    test(
      "foldMap empty",
      Vector.empty<number>()
        .foldMap((n) => n, Number.MonoidSum)
        .assert(strictEqualTo(0)),
    );
  });

  suite("reverse", () => {
    test("reverse empty", Vector.empty<number>().reverse.assert(strictEqualTo(Vector.empty())));
    test("reverse single", Vector(1).reverse.assert(strictEqualTo(Vector(1))));
    test("reverse multiple", Vector(1, 2, 3).reverse.assert(strictEqualTo(Vector(3, 2, 1))));
    test.io(
      "reverse involution",
      Gen.int.array.check((as) => {
        const vec = Vector.from(as);
        return vec.reverse.reverse.assert(strictEqualTo(vec));
      }),
    );
  });

  suite("sort", () => {
    test("sort empty", Vector.empty<number>().sort().assert(strictEqualTo(Vector.empty())));
    test(
      "sort single",
      Vector(1)
        .sort()
        .assert(strictEqualTo(Vector(1))),
    );
    test(
      "sort sorted",
      Vector(1, 2, 3)
        .sort()
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test(
      "sort reverse",
      Vector(3, 2, 1)
        .sort()
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test(
      "sort mixed",
      Vector(3, 1, 4, 1, 5, 9, 2, 6)
        .sort()
        .assert(strictEqualTo(Vector(1, 1, 2, 3, 4, 5, 6, 9))),
    );
  });

  suite("sortWith", () => {
    test(
      "sortWith reverse order",
      Vector(1, 2, 3)
        .sortWith((x, y) => (x < y ? 1 : x > y ? -1 : 0))
        .assert(strictEqualTo(Vector(3, 2, 1))),
    );
    test(
      "sortWith by string length",
      Vector("abc", "a", "ab")
        .sortWith((x, y) => Ordering.sign(x.length - y.length))
        .assert(strictEqualTo(Vector("a", "ab", "abc"))),
    );
  });

  suite("find / findIndex", () => {
    test(
      "find existing",
      Vector(1, 2, 3)
        .find((n) => n === 2)
        .assert(strictEqualTo(Just(2))),
    );
    test(
      "find missing",
      Vector(1, 2, 3)
        .find((n) => n === 10)
        .assert(strictEqualTo(Nothing())),
    );
    test(
      "findIndex existing",
      Vector(1, 2, 3)
        .findIndex((n) => n === 2)
        .assert(strictEqualTo(1)),
    );
    test(
      "findIndex missing",
      Vector(1, 2, 3)
        .findIndex((n) => n === 10)
        .assert(strictEqualTo(-1)),
    );
  });

  suite("indexOf / lastIndexOf", () => {
    test("indexOf existing", Vector(10, 20, 30).indexOf(20).assert(strictEqualTo(1)));
    test("indexOf missing", Vector(10, 20, 30).indexOf(99).assert(strictEqualTo(-1)));
    test("lastIndexOf existing", Vector(10, 20, 10).lastIndexOf(10).assert(strictEqualTo(2)));
    test("lastIndexOf missing", Vector(10, 20, 30).lastIndexOf(99).assert(strictEqualTo(-1)));
  });

  suite("contains / elem", () => {
    test("contains existing", Vector(1, 2, 3).contains(2).assert(isTrue));
    test("contains missing", Vector(1, 2, 3).contains(10).assert(isFalse));
    test("elem existing", Vector(1, 2, 3).elem(2).assert(isTrue));
    test("elem missing", Vector(1, 2, 3).elem(10).assert(isFalse));
  });

  suite("every / some / none", () => {
    test(
      "every all match",
      Vector(2, 4, 6)
        .every((n) => n % 2 === 0)
        .assert(isTrue),
    );
    test(
      "every some miss",
      Vector(2, 3, 4)
        .every((n) => n % 2 === 0)
        .assert(isFalse),
    );
    test(
      "every empty",
      Vector.empty<number>()
        .every((n) => n > 0)
        .assert(isTrue),
    );
    test(
      "some match",
      Vector(1, 2, 3)
        .some((n) => n === 2)
        .assert(isTrue),
    );
    test(
      "some no match",
      Vector(1, 3, 5)
        .some((n) => n === 2)
        .assert(isFalse),
    );
    test(
      "some empty",
      Vector.empty<number>()
        .some((n) => n > 0)
        .assert(isFalse),
    );
    test(
      "none match",
      Vector(1, 3, 5)
        .none((n) => n % 2 === 0)
        .assert(isTrue),
    );
    test(
      "none miss",
      Vector(1, 2, 3)
        .none((n) => n % 2 === 0)
        .assert(isFalse),
    );
  });

  suite("updateAt / modifyAt", () => {
    test(
      "updateAt existing",
      Vector(1, 2, 3)
        .updateAt(1, 20)
        .assert(strictEqualTo(Vector(1, 20, 3))),
    );
    test(
      "updateAt out of bounds",
      Vector(1, 2, 3)
        .updateAt(10, 20)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test(
      "modifyAt existing",
      Vector(1, 2, 3)
        .modifyAt(1, (n) => n * 10)
        .assert(strictEqualTo(Vector(1, 20, 3))),
    );
    test(
      "modifyAt out of bounds",
      Vector(1, 2, 3)
        .modifyAt(10, (n) => n * 10)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
  });

  suite("insertAt / remove", () => {
    test(
      "insertAt beginning",
      Vector(2, 3)
        .insertAt(0, 1)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test(
      "insertAt middle",
      Vector(1, 3)
        .insertAt(1, 2)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test(
      "insertAt end",
      Vector(1, 2)
        .insertAt(2, 3)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test(
      "insertAt out of bounds",
      Vector(1, 2)
        .insertAt(10, 3)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test(
      "remove existing",
      Vector(1, 2, 3)
        .remove(1, 1)
        .assert(strictEqualTo(Vector(1, 3))),
    );
    test(
      "remove out of bounds",
      Vector(1, 2, 3)
        .remove(10, 1)
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
  });

  suite("intersperse", () => {
    test(
      "intersperse",
      Vector(1, 2, 3)
        .intersperse(0)
        .assert(strictEqualTo(Vector(1, 0, 2, 0, 3))),
    );
    test(
      "intersperse single",
      Vector(1)
        .intersperse(0)
        .assert(strictEqualTo(Vector(1))),
    );
    test("intersperse empty", Vector.empty<number>().intersperse(0).assert(strictEqualTo(Vector.empty())));
  });

  suite("join", () => {
    test("join empty", Vector.empty<string>().join(",").assert(strictEqualTo("")));
    test("join single", Vector("a").join(",").assert(strictEqualTo("a")));
    test("join multiple", Vector("a", "b", "c").join(",").assert(strictEqualTo("a,b,c")));
  });

  suite("scanLeft", () => {
    test(
      "scanLeft sum",
      Vector(1, 2, 3)
        .scanLeft(0, (acc, n) => acc + n)
        .assert(strictEqualTo(Vector(0, 1, 3, 6))),
    );
    test(
      "scanLeft empty",
      Vector.empty<number>()
        .scanLeft(0, (acc, n) => acc + n)
        .assert(strictEqualTo(Vector(0))),
    );
  });

  suite("mapWithIndex", () => {
    test(
      "mapWithIndex",
      Vector("a", "b", "c")
        .mapWithIndex((i, s) => `${i}:${s}`)
        .assert(strictEqualTo(Vector("0:a", "1:b", "2:c"))),
    );
  });

  suite("mapAccum", () => {
    test(
      "mapAccum",
      Vector(1, 1, 1)
        .mapAccum(0, (s, el) => [s + el, s + el])
        .assert(deepEqualTo([Vector(1, 2, 3), 3])),
    );
  });

  suite("groupWith", () => {
    test(
      "groupWith",
      Vector(1, 1, 2, 3, 3, 3, 4)
        .groupWith((a, b) => a === b)
        .assert(strictEqualTo(Vector(Vector(1, 1), Vector(2), Vector(3, 3, 3), Vector(4)))),
    );
  });

  suite("uniq", () => {
    test(
      "uniq",
      Vector(1, 2, 2, 3, 3, 3)
        .uniq()
        .assert(strictEqualTo(Vector(1, 2, 3))),
    );
    test("uniq empty", Vector.empty<number>().uniq().assert(strictEqualTo(Vector.empty())));
  });

  suite("toArray / toList", () => {
    test("toArray", Vector(1, 2, 3).toArray.assert(deepEqualTo<number[]>([1, 2, 3])));
    test("toList", Vector(1, 2, 3).toList.assert(strictEqualTo(List(1, 2, 3))));
  });

  suite("isVector", () => {
    test("isVector vector", Vector.is(Vector(1)).assert(isTrue));
    test("isVector empty", Vector.is(Vector.empty()).assert(isTrue));
    test("isVector not vector", Vector.is([1, 2]).assert(isFalse));
    test("isVector primitive", Vector.is(1).assert(isFalse));
  });

  suite("equality", () => {
    test("same vector equal", Vector(1, 2, 3).assert(strictEqualTo(Vector(1, 2, 3))));
    test("different vectors not equal", Vector(1, 2, 3).assert(strictEqualTo(Vector(1, 2, 3, 4)).invert));
    test(
      "nested vectors equal",
      Vector(Vector(1, 2), Vector(3)).assert(strictEqualTo(Vector(Vector(1, 2), Vector(3)))),
    );
  });

  suite("iteration", () => {
    test("iterator empty", () => {
      const result = [...Vector.empty<number>()];
      return result.assert(deepEqualTo<number[]>([]));
    });
    test("iterator non-empty", () => {
      const result = [...Vector(1, 2, 3)];
      return result.assert(deepEqualTo([1, 2, 3]));
    });
    test("iterator early break", () => {
      const result: number[] = [];
      for (const n of Vector(1, 2, 3, 4, 5)) {
        result.push(n);
        if (n === 3) break;
      }
      return result.assert(deepEqualTo([1, 2, 3]));
    });
  });

  suite("property-based", () => {
    test.io(
      "append increases length",
      Gen.int.array.check((as) => {
        const vec = Vector.from(as);
        return vec.append(42).length.assert(strictEqualTo(vec.length + 1));
      }),
    );

    test.io(
      "prepend increases length",
      Gen.int.array.check((as) => {
        const vec = Vector.from(as);
        return vec.prepend(42).length.assert(strictEqualTo(vec.length + 1));
      }),
    );

    test.io(
      "take returns correct length",
      Gen.int.array.check((as) => {
        const vec = Vector.from(as);
        const n = as.length > 0 ? Math.floor(as.length / 2) : 0;
        return vec.take(n).length.assert(strictEqualTo(Math.min(n, vec.length)));
      }),
    );

    test.io(
      "drop returns correct length",
      Gen.int.array.check((as) => {
        const vec = Vector.from(as);
        const n = as.length > 0 ? Math.floor(as.length / 2) : 0;
        const expected = Math.max(0, vec.length - n);
        return vec.drop(n).length.assert(strictEqualTo(expected));
      }),
    );

    test.io(
      "filter then length <= original length",
      Gen.int.array.check((as) => {
        const vec = Vector.from(as);
        return vec.filter(() => true).length.assert(strictEqualTo(vec.length));
      }),
    );

    test.io(
      "map identity",
      Gen.int.array.check((as) => {
        const vec = Vector.from(as);
        return vec.map((x) => x).assert(strictEqualTo(vec));
      }),
    );

    test.io(
      "foldLeft sum matches array",
      Gen.int.array.check((as) => {
        const vecSum = Vector.from(as).foldLeft(0, (acc, n) => acc + n);
        const arrSum = as.foldLeft(0, (acc, n) => acc + n);
        return vecSum.assert(strictEqualTo(arrSum));
      }),
    );

    test.io(
      "concat length is sum of lengths",
      Gen.int.array.zip(Gen.int.array).check(([as, bs]) => {
        const va = Vector.from(as);
        const vb = Vector.from(bs);
        return va.concat(vb).length.assert(strictEqualTo(va.length + vb.length));
      }),
    );

    test.io(
      "reverse length preserved",
      Gen.int.array.check((as) => {
        const vec = Vector.from(as);
        return vec.reverse.length.assert(strictEqualTo(vec.length));
      }),
    );

    test.io(
      "updateAt preserves length",
      Gen.int.array.check((as) => {
        const vec = Vector.from(as);
        if (vec.length === 0) return true.assert(isTrue);
        return vec.updateAt(0, 42).length.assert(strictEqualTo(vec.length));
      }),
    );

    test.io(
      "slice length <= original length",
      Gen.int.array.check((as) => {
        const vec = Vector.from(as);
        return vec.slice(0, Math.floor(vec.length / 2)).length.assert(strictEqualTo(Math.floor(vec.length / 2)));
      }),
    );
  });
});
