suite("List", () => {
  suite("constructors", () => {
    test("empty", List.empty<number>().assert(strictEqualTo(Nil())));

    test("nil", Nil<number>().assert(strictEqualTo(Nil())));

    test("cons", Cons(1, Nil()).assert(strictEqualTo(List(1))));

    test("make variadic", List(1, 2, 3).assert(strictEqualTo(Cons(1, Cons(2, Cons(3, Nil()))))));

    test("from array", List.from([1, 2, 3]).assert(strictEqualTo(List(1, 2, 3))));

    test("from iterable (toList)", ([1, 2, 3] as Iterable<number>).toList.assert(strictEqualTo(List(1, 2, 3))));

    test("from empty iterable", ([] as Iterable<never>).toList.assert(strictEqualTo(Nil())));
  });

  suite("isEmpty / isNonEmpty", () => {
    test("empty is empty", Nil().isEmpty().assert(isTrue));
    test("empty is not non-empty", Nil().isNonEmpty().assert(isFalse));
    test("non-empty is not empty", List(1).isEmpty().assert(isFalse));
    test("non-empty is non-empty", List(1).isNonEmpty().assert(isTrue));
  });

  suite("head", () => {
    test("safe head on empty", Nil<number>().head.assert(strictEqualTo(Nothing())));
    test("safe head on non-empty", List(1, 2).head.assert(strictEqualTo(Just(1))));
  });

  suite("unsafeHead", () => {
    test("unsafeHead returns first element", List(1, 2, 3).unsafeHead.assert(strictEqualTo(1)));
    test("unsafeHead on empty throws", () => {
      let threw = false;
      try {
        Nil().unsafeHead;
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });
  });

  suite("tail", () => {
    test("safe tail on empty", Nil<number>().tail.assert(strictEqualTo(Nothing())));
    test("safe tail on single", List(1).tail.assert(strictEqualTo(Just(Nil()))));
    test("safe tail on multiple", List(1, 2, 3).tail.assert(strictEqualTo(Just(List(2, 3)))));
  });

  suite("unsafeTail", () => {
    test("unsafeTail returns remainder", List(1, 2, 3).unsafeTail.assert(strictEqualTo(List(2, 3))));
    test("unsafeTail on empty throws", () => {
      let threw = false;
      try {
        Nil().unsafeTail;
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });
  });

  suite("unsafeLast", () => {
    test("unsafeLast on single", List(1).unsafeLast.assert(strictEqualTo(1)));
    test("unsafeLast on multiple", List(1, 2, 3).unsafeLast.assert(strictEqualTo(3)));
    test("unsafeLast on empty throws", () => {
      let threw = false;
      try {
        Nil().unsafeLast;
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });
  });

  suite("length", () => {
    test("empty length", Nil().length.assert(strictEqualTo(0)));
    test("single length", List(1).length.assert(strictEqualTo(1)));
    test("multiple length", List(1, 2, 3, 4, 5).length.assert(strictEqualTo(5)));
  });

  suite("prepend", () => {
    test(
      "prepend to empty",
      Nil()
        .prepend(1)
        .assert(strictEqualTo(List(1))),
    );
    test(
      "prepend to non-empty",
      List(2, 3)
        .prepend(1)
        .assert(strictEqualTo(List(1, 2, 3))),
    );
  });

  suite("prepend operator (+)", () => {
    test("operator prepend", (1 + List(2, 3)).assert(strictEqualTo(List(1, 2, 3))));
  });

  suite("prependAll", () => {
    test("both empty", Nil().prependAll(Nil()).assert(strictEqualTo(Nil())));
    test(
      "self empty",
      Nil()
        .prependAll(List(1, 2))
        .assert(strictEqualTo(List(1, 2))),
    );
    test(
      "prefix empty",
      List(1, 2)
        .prependAll(Nil())
        .assert(strictEqualTo(List(1, 2))),
    );
    test(
      "both non-empty",
      List(3, 4)
        .prependAll(List(1, 2))
        .assert(strictEqualTo(List(1, 2, 3, 4))),
    );
  });

  suite("concat", () => {
    test(
      "concat empty left",
      Nil()
        .concat(List(1, 2))
        .assert(strictEqualTo(List(1, 2))),
    );
    test(
      "concat empty right",
      List(1, 2)
        .concat(Nil())
        .assert(strictEqualTo(List(1, 2))),
    );
    test(
      "concat both",
      List(1, 2)
        .concat(List(3, 4))
        .assert(strictEqualTo(List(1, 2, 3, 4))),
    );
  });

  suite("map", () => {
    test(
      "map empty",
      Nil<number>()
        .map((n) => n + 1)
        .assert(strictEqualTo(Nil())),
    );
    test(
      "map non-empty",
      List(1, 2, 3)
        .map((n) => n + 1)
        .assert(strictEqualTo(List(2, 3, 4))),
    );
    test(
      "map to different type",
      List(1, 2, 3)
        .map((n) => n.toString())
        .assert(strictEqualTo(List("1", "2", "3"))),
    );
  });

  suite("flatMap", () => {
    test(
      "flatMap empty",
      Nil<number>()
        .flatMap((n) => List(n, n))
        .assert(strictEqualTo(Nil())),
    );
    test(
      "flatMap non-empty",
      List(1, 2)
        .flatMap((n) => List(n, n))
        .assert(strictEqualTo(List(1, 1, 2, 2))),
    );
    test(
      "flatMap to empty lists",
      List(1, 2)
        .flatMap(() => Nil())
        .assert(strictEqualTo(Nil())),
    );
    test(
      "flatMap mixed",
      List(1, 2)
        .flatMap((n) => (n === 1 ? List(n) : Nil()))
        .assert(strictEqualTo(List(1))),
    );
  });

  suite("filter", () => {
    test(
      "filter empty",
      Nil<number>()
        .filter((n) => n > 0)
        .assert(strictEqualTo(Nil())),
    );
    test(
      "filter all match",
      List(1, 2, 3)
        .filter((n) => n > 0)
        .assert(strictEqualTo(List(1, 2, 3))),
    );
    test(
      "filter none match",
      List(1, 2, 3)
        .filter((n) => n > 10)
        .assert(strictEqualTo(Nil())),
    );
    test(
      "filter some match",
      List(1, 2, 3, 4, 5)
        .filter((n) => n % 2 === 0)
        .assert(strictEqualTo(List(2, 4))),
    );
    test(
      "filter first miss",
      List(1, 3, 2, 4)
        .filter((n) => n % 2 === 0)
        .assert(strictEqualTo(List(2, 4))),
    );
  });

  suite("some", () => {
    test(
      "some empty",
      Nil<number>()
        .some((n) => n > 0)
        .assert(isFalse),
    );
    test(
      "some match",
      List(1, 2, 3)
        .some((n) => n === 2)
        .assert(isTrue),
    );
    test(
      "some no match",
      List(1, 2, 3)
        .some((n) => n === 10)
        .assert(isFalse),
    );
    test(
      "some first match",
      List(2, 4, 6)
        .some((n) => n % 2 !== 0)
        .assert(isFalse),
    );
  });

  suite("forEach", () => {
    test("forEach empty", () => {
      let called = 0;
      Nil().forEach(() => called++);
      return called.assert(strictEqualTo(0));
    });
    test("forEach non-empty", () => {
      const acc: number[] = [];
      List(1, 2, 3).forEach((n) => acc.push(n));
      return acc.assert(deepEqualTo([1, 2, 3]));
    });
  });

  suite("foldLeft", () => {
    test(
      "foldLeft empty",
      Nil<number>()
        .foldLeft(0, (acc, n) => acc + n)
        .assert(strictEqualTo(0)),
    );
    test(
      "foldLeft sum",
      List(1, 2, 3)
        .foldLeft(0, (acc, n) => acc + n)
        .assert(strictEqualTo(6)),
    );
    test(
      "foldLeft product",
      List(1, 2, 3, 4)
        .foldLeft(1, (acc, n) => acc * n)
        .assert(strictEqualTo(24)),
    );
    test(
      "foldLeft string concat",
      List("a", "b", "c")
        .foldLeft("", (acc, s) => acc + s)
        .assert(strictEqualTo("abc")),
    );
  });

  suite("reverse", () => {
    test("reverse empty", Nil().reverse.assert(strictEqualTo(Nil())));
    test("reverse single", List(1).reverse.assert(strictEqualTo(List(1))));
    test("reverse multiple", List(1, 2, 3).reverse.assert(strictEqualTo(List(3, 2, 1))));
  });

  suite("take", () => {
    test("take from empty", Nil().take(5).assert(strictEqualTo(Nil())));
    test("take zero", List(1, 2, 3).take(0).assert(strictEqualTo(Nil())));
    test("take negative", List(1, 2, 3).take(-1).assert(strictEqualTo(Nil())));
    test(
      "take some",
      List(1, 2, 3, 4, 5)
        .take(3)
        .assert(strictEqualTo(List(1, 2, 3))),
    );
    test(
      "take all",
      List(1, 2, 3)
        .take(5)
        .assert(strictEqualTo(List(1, 2, 3))),
    );
  });

  suite("join", () => {
    test("join empty", Nil<string>().join(",").assert(strictEqualTo("")));
    test("join single", List("a").join(",").assert(strictEqualTo("a")));
    test("join multiple", List("a", "b", "c").join(",").assert(strictEqualTo("a,b,c")));
  });

  suite("sort", () => {
    test("sort empty", Nil<number>().sort().assert(strictEqualTo(Nil())));
    test(
      "sort single",
      List(1)
        .sort()
        .assert(strictEqualTo(List(1))),
    );
    test(
      "sort sorted",
      List(1, 2, 3)
        .sort()
        .assert(strictEqualTo(List(1, 2, 3))),
    );
    test(
      "sort reverse",
      List(3, 2, 1)
        .sort()
        .assert(strictEqualTo(List(1, 2, 3))),
    );
    test(
      "sort mixed",
      List(3, 1, 4, 1, 5, 9, 2, 6)
        .sort()
        .assert(strictEqualTo(List(1, 1, 2, 3, 4, 5, 6, 9))),
    );
  });

  suite("sortWith", () => {
    test(
      "sortWith reverse order",
      List(1, 2, 3)
        .sortWith((x, y) => (x < y ? 1 : x > y ? -1 : 0))
        .assert(strictEqualTo(List(3, 2, 1))),
    );
    test(
      "sortWith by string length",
      List("abc", "a", "ab")
        .sortWith((x, y) => Ordering.sign(x.length - y.length))
        .assert(strictEqualTo(List("a", "ab", "abc"))),
    );
  });

  suite("isList", () => {
    test("isList Cons", List.is(List(1)).assert(isTrue));
    test("isList Nil", List.is(Nil()).assert(isTrue));
    test("isList not list", List.is([1, 2]).assert(isFalse));
    test("isList primitive", List.is(1).assert(isFalse));
    test("isList object", List.is({}).assert(isFalse));
  });

  suite("equality", () => {
    test("same list equal", List(1, 2, 3).assert(strictEqualTo(List(1, 2, 3))));
    test("different lists not equal", List(1, 2, 3).assert(strictEqualTo(List(1, 2, 3, 4)).invert));
    test("nil equal", Nil().assert(strictEqualTo(Nil())));
    test("nested lists equal", List(List(1, 2), List(3)).assert(strictEqualTo(List(List(1, 2), List(3)))));
  });

  suite("iteration", () => {
    test("iterator empty", () => {
      const result = [...Nil()];
      return result.assert(deepEqualTo<Array<unknown>>([]));
    });
    test("iterator non-empty", () => {
      const result = [...List(1, 2, 3)];
      return result.assert(deepEqualTo([1, 2, 3]));
    });
    test("iterator early break", () => {
      const result: number[] = [];
      for (const n of List(1, 2, 3, 4, 5)) {
        result.push(n);
        if (n === 3) break;
      }
      return result.assert(deepEqualTo([1, 2, 3]));
    });
  });

  suite("property-based", () => {
    test.io(
      "reverse is involution",
      Gen.int.array.check((as) => {
        const list = List.from(as);
        return list.reverse.reverse.assert(strictEqualTo(list));
      }),
    );

    test.io(
      "prepend increases length",
      Gen.int.array.check((as) => {
        const list = List.from(as);
        return list.prepend(42).length.assert(strictEqualTo(list.length + 1));
      }),
    );

    test.io(
      "take returns correct length",
      Gen.int.array.check((as) => {
        const list   = List.from(as);
        const n      = as.length > 0 ? Math.floor(as.length / 2) : 0;
        const actual = list.take(n).length;
        return actual.assert(strictEqualTo(Math.min(n, list.length)));
      }),
    );

    test.io(
      "filter then length <= original length",
      Gen.int.array.check((as) => {
        const list     = List.from(as);
        const expected = List.from(as.filter((n) => n % 2 === 0));
        const filtered = list.filter((n) => n % 2 === 0);
        return (filtered.length <= list.length).assert(isTrue) && filtered.assert(strictEqualTo(expected));
      }),
    );

    test.io(
      "map identity",
      Gen.int.array.check((as) => {
        const list = List.from(as);
        return list.map((x) => x).assert(strictEqualTo(list));
      }),
    );

    test.io(
      "foldLeft sum matches array",
      Gen.int.array.check((as) => {
        const listSum = List.from(as).foldLeft(0, (acc, n) => acc + n);
        const arrSum  = as.foldLeft(0, (acc, n) => acc + n);
        return listSum.assert(strictEqualTo(arrSum));
      }),
    );

    test.io(
      "concat length is sum of lengths",
      Gen.int.array.zip(Gen.int.array).check(([as, bs]) => {
        const la = List.from(as);
        const lb = List.from(bs);
        return la.concat(lb).length.assert(strictEqualTo(la.length + lb.length));
      }),
    );

    test.io(
      "reverse length preserved",
      Gen.int.array.check((as) => {
        const list = List.from(as);
        return list.reverse.length.assert(strictEqualTo(list.length));
      }),
    );
  });
});
