suite("ReadonlyNonEmptyArray", () => {
  suite("constructors", () => {
    test("variadic constructor", ReadonlyNonEmptyArray(1, 2, 3).assert(deepEqualTo([1, 2, 3])));
    test("from preserves a statically non-empty array", ReadonlyNonEmptyArray.from([1, 2]).assert(deepEqualTo([1, 2])));
    test(
      "fromArray returns Just for non-empty arrays",
      ReadonlyNonEmptyArray.fromArray([1, 2]).assert(deepEqualTo(Just([1, 2]))),
    );
    test(
      "fromArray returns Nothing for empty arrays",
      ReadonlyNonEmptyArray.fromArray([]).assert(strictEqualTo(Nothing())),
    );
    test("unsafeAsNonEmptyArray casts non-empty arrays", [1, 2].unsafeAsNonEmptyArray.assert(deepEqualTo([1, 2])));
    test("unsafeAsNonEmptyArray throws on empty arrays", () => {
      let threw = false;
      try {
        [].unsafeAsNonEmptyArray;
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });
  });

  suite("makeBy", () => {
    test("constructs by index", ReadonlyNonEmptyArray.makeBy(3, (i) => i).assert(deepEqualTo([0, 1, 2])));
    test("zero count still produces the head", ReadonlyNonEmptyArray.makeBy(0, (i) => i).assert(deepEqualTo([0])));
    test("negative count still produces the head", ReadonlyNonEmptyArray.makeBy(-1, (i) => i).assert(deepEqualTo([0])));
    test("floors fractional counts", ReadonlyNonEmptyArray.makeBy(2.9, (i) => i).assert(deepEqualTo([0, 1])));
  });

  suite("replicate", () => {
    test("replicates a value", ReadonlyNonEmptyArray.replicate(3, "a").assert(deepEqualTo(["a", "a", "a"])));
    test("zero count still produces one value", ReadonlyNonEmptyArray.replicate(0, "a").assert(deepEqualTo(["a"])));
  });

  suite("range", () => {
    test("inclusive ascending range", ReadonlyNonEmptyArray.range(1, 3).assert(deepEqualTo([1, 2, 3])));
    test("single element range", ReadonlyNonEmptyArray.range(5, 5).assert(deepEqualTo([5])));
    test("descending range returns the start only", ReadonlyNonEmptyArray.range(3, 1).assert(deepEqualTo([3])));
  });

  suite("destructors", () => {
    test("head", ReadonlyNonEmptyArray(1, 2, 3).head.assert(strictEqualTo(1)));
    test("last on single", ReadonlyNonEmptyArray(1).last.assert(strictEqualTo(1)));
    test("last on multiple", ReadonlyNonEmptyArray(1, 2, 3).last.assert(strictEqualTo(3)));
    test("init on single", ReadonlyNonEmptyArray(1).init.assert(deepEqualTo([])));
    test("init on multiple", ReadonlyNonEmptyArray(1, 2, 3).init.assert(deepEqualTo([1, 2])));
    test("tail on single", ReadonlyNonEmptyArray(1).tail.assert(deepEqualTo([])));
    test("tail on multiple", ReadonlyNonEmptyArray(1, 2, 3).tail.assert(deepEqualTo([2, 3])));
    test("unappend", ReadonlyNonEmptyArray(1, 2, 3).unappend.assert(deepEqualTo([[1, 2], 3])));
    test("unprepend", ReadonlyNonEmptyArray(1, 2, 3).unprepend.assert(deepEqualTo([1, [2, 3]])));
  });

  suite("append", () => {
    test(
      "appends an element",
      ReadonlyNonEmptyArray(1, 2)
        .append(3)
        .assert(deepEqualTo([1, 2, 3])),
    );
    test("preserves the original", () => {
      const original = ReadonlyNonEmptyArray(1, 2);
      const appended = original.append(3);
      return original.assert(deepEqualTo([1, 2])) && appended.assert(deepEqualTo([1, 2, 3]));
    });
  });

  suite("prepend", () => {
    test(
      "prepends an element",
      ReadonlyNonEmptyArray(2, 3)
        .prepend(1)
        .assert(deepEqualTo([1, 2, 3])),
    );
    test("preserves the original", () => {
      const original  = ReadonlyNonEmptyArray(2, 3);
      const prepended = original.prepend(1);
      return original.assert(deepEqualTo([2, 3])) && prepended.assert(deepEqualTo([1, 2, 3]));
    });
  });

  suite("concat", () => {
    test(
      "concatenates with a non-empty array",
      ReadonlyNonEmptyArray(1, 2)
        .concat([3, 4])
        .assert(deepEqualTo([1, 2, 3, 4])),
    );
    test(
      "concatenating an empty array returns the same values",
      ReadonlyNonEmptyArray(1, 2)
        .concat([])
        .assert(deepEqualTo([1, 2])),
    );
  });

  suite("map", () => {
    test(
      "maps every element",
      ReadonlyNonEmptyArray(1, 2, 3)
        .map((n) => n * 2)
        .assert(deepEqualTo([2, 4, 6])),
    );
    test(
      "maps a single element",
      ReadonlyNonEmptyArray(1)
        .map((n) => n + 1)
        .assert(deepEqualTo([2])),
    );
  });

  suite("mapWithIndex", () => {
    test(
      "maps with element indexes",
      ReadonlyNonEmptyArray("a", "b", "c")
        .mapWithIndex((i, a) => `${i}:${a}`)
        .assert(deepEqualTo(["0:a", "1:b", "2:c"])),
    );
  });

  suite("ap", () => {
    test(
      "applies every function to every value",
      ReadonlyNonEmptyArray(
        (n: number) => n + 1,
        (n: number) => n * 2,
      )
        .ap(ReadonlyNonEmptyArray(1, 2))
        .assert(deepEqualTo([2, 3, 2, 4])),
    );
  });

  suite("flatMap", () => {
    test(
      "concatenates non-empty results",
      ReadonlyNonEmptyArray(1, 2)
        .flatMap((n) => ReadonlyNonEmptyArray(n, n + 10))
        .assert(deepEqualTo([1, 11, 2, 12])),
    );
    test(
      "maps a single element",
      ReadonlyNonEmptyArray(1)
        .flatMap((n) => ReadonlyNonEmptyArray(n, n + 1))
        .assert(deepEqualTo([1, 2])),
    );
  });

  suite("flatMapWithIndex", () => {
    test(
      "uses indexes",
      ReadonlyNonEmptyArray("a", "b")
        .flatMapWithIndex((i, a) => ReadonlyNonEmptyArray(`${i}:${a}`))
        .assert(deepEqualTo(["0:a", "1:b"])),
    );
  });

  suite("flatten", () => {
    test(
      "flattens nested non-empty arrays",
      ReadonlyNonEmptyArray(ReadonlyNonEmptyArray(1, 2), ReadonlyNonEmptyArray(3)).flatten.assert(
        deepEqualTo([1, 2, 3]),
      ),
    );
  });

  suite("folding", () => {
    test(
      "fold combines all values with a Semigroup",
      ReadonlyNonEmptyArray(1, 2, 3).fold(Number.MonoidSum).assert(strictEqualTo(6)),
    );
    test(
      "foldLeft",
      ReadonlyNonEmptyArray(1, 2, 3)
        .foldLeft("", (s, n) => `${s}${n}`)
        .assert(strictEqualTo("123")),
    );
    test(
      "foldLeftWithIndex",
      ReadonlyNonEmptyArray("a", "b")
        .foldLeftWithIndex("", (i, s, a) => `${s}${i}${a}`)
        .assert(strictEqualTo("0a1b")),
    );
    test(
      "foldRight",
      ReadonlyNonEmptyArray(1, 2, 3)
        .foldRight("", (n, s) => `${s}${n}`)
        .assert(strictEqualTo("321")),
    );
    test(
      "foldRightWithIndex",
      ReadonlyNonEmptyArray("a", "b")
        .foldRightWithIndex("", (i, a, s) => `${s}${i}${a}`)
        .assert(strictEqualTo("1b0a")),
    );
    test(
      "foldMap",
      ReadonlyNonEmptyArray(1, 2, 3)
        .foldMap((n) => n * 2, Number.MonoidSum)
        .assert(strictEqualTo(12)),
    );
    test(
      "foldMapWithIndex",
      ReadonlyNonEmptyArray(1, 2, 3)
        .foldMapWithIndex((i, n) => i + n, Number.MonoidSum)
        .assert(strictEqualTo(9)),
    );
  });

  suite("chop", () => {
    test(
      "repeatedly consumes the rest",
      ReadonlyNonEmptyArray(1, 2, 3, 4)
        .chop((as) => [as.head, as.tail])
        .assert(deepEqualTo([1, 2, 3, 4])),
    );
  });

  suite("chunksOf", () => {
    test(
      "splits into non-empty chunks",
      ReadonlyNonEmptyArray(1, 2, 3, 4, 5)
        .chunksOf(2)
        .assert(deepEqualTo([[1, 2], [3, 4], [5]])),
    );
    test(
      "uses at least one element per chunk",
      ReadonlyNonEmptyArray(1, 2)
        .chunksOf(0)
        .assert(deepEqualTo([[1], [2]])),
    );
  });

  suite("splitAt", () => {
    test(
      "splits in the middle",
      ReadonlyNonEmptyArray(1, 2, 3)
        .splitAt(2)
        .assert(deepEqualTo([[1, 2], [3]])),
    );
    test(
      "keeps at least one element in the left side",
      ReadonlyNonEmptyArray(1, 2, 3)
        .splitAt(0)
        .assert(deepEqualTo([[1], [2, 3]])),
    );
    test(
      "split past end returns empty right side",
      ReadonlyNonEmptyArray(1, 2)
        .splitAt(10)
        .assert(deepEqualTo([[1, 2], []])),
    );
  });

  suite("cross", () => {
    test(
      "cartesian product",
      ReadonlyNonEmptyArray(1, 2)
        .cross(ReadonlyNonEmptyArray("a", "b"))
        .assert(deepEqualTo([Zipped(1, "a"), Zipped(1, "b"), Zipped(2, "a"), Zipped(2, "b")])),
    );
  });

  suite("crossWith", () => {
    test(
      "cartesian product with a function",
      ReadonlyNonEmptyArray(1, 2)
        .crossWith(ReadonlyNonEmptyArray("a", "b"), (n, s) => `${n}${s}`)
        .assert(deepEqualTo(["1a", "1b", "2a", "2b"])),
    );
  });

  suite("zipWith", () => {
    test(
      "zips to the shorter length",
      ReadonlyNonEmptyArray(1, 2, 3)
        .zipWith(ReadonlyNonEmptyArray("a", "b"), (n, s) => `${n}${s}`)
        .assert(deepEqualTo(["1a", "2b"])),
    );
    test(
      "zips single values",
      ReadonlyNonEmptyArray(1)
        .zipWith(ReadonlyNonEmptyArray("a", "b"), (n, s) => `${n}${s}`)
        .assert(deepEqualTo(["1a"])),
    );
  });

  suite("align", () => {
    test(
      "aligns left leftovers",
      ReadonlyNonEmptyArray(1, 2)
        .align(ReadonlyNonEmptyArray("a"))
        .assert(deepEqualTo([These.both(1, "a"), These.left(2)])),
    );
    test(
      "aligns right leftovers",
      ReadonlyNonEmptyArray(1)
        .align(ReadonlyNonEmptyArray("a", "b"))
        .assert(deepEqualTo([These.both(1, "a"), These.right("b")])),
    );
  });

  suite("alignWith", () => {
    test(
      "maps aligned values",
      ReadonlyNonEmptyArray(1, 2)
        .alignWith(ReadonlyNonEmptyArray(10, 20, 30), (t) =>
          t.match(
            (a) => a,
            (b) => b,
            (a, b) => a + b,
          ),
        )
        .assert(deepEqualTo([11, 22, 30])),
    );
  });

  suite("elem", () => {
    test("returns true when the element is present", ReadonlyNonEmptyArray(1, 2, 3).elem(2, Number.Eq).assert(isTrue));
    test("returns false when the element is absent", ReadonlyNonEmptyArray(1, 2, 3).elem(4, Number.Eq).assert(isFalse));
  });

  suite("group", () => {
    test(
      "groups adjacent equal values",
      ReadonlyNonEmptyArray(1, 1, 2, 1)
        .group(Number.Eq)
        .assert(deepEqualTo([[1, 1], [2], [1]])),
    );
    test(
      "groups a single value",
      ReadonlyNonEmptyArray(1)
        .group(Number.Eq)
        .assert(deepEqualTo([[1]])),
    );
  });

  suite("groupSort", () => {
    test(
      "sorts before grouping",
      ReadonlyNonEmptyArray(2, 1, 2, 1)
        .groupSort(Number.Ord)
        .assert(
          deepEqualTo([
            [1, 1],
            [2, 2],
          ]),
        ),
    );
  });

  suite("isOutOfBound", () => {
    test("negative index", ReadonlyNonEmptyArray(1, 2).isOutOfBound(-1).assert(isTrue));
    test("index equal to length", ReadonlyNonEmptyArray(1, 2).isOutOfBound(2).assert(isTrue));
    test("index inside bounds", ReadonlyNonEmptyArray(1, 2).isOutOfBound(1).assert(isFalse));
  });

  suite("min and max", () => {
    test("max", ReadonlyNonEmptyArray(2, 1, 3).max(Number.Ord).assert(strictEqualTo(3)));
    test("max single", ReadonlyNonEmptyArray(2).max(Number.Ord).assert(strictEqualTo(2)));
    test("min", ReadonlyNonEmptyArray(2, 1, 3).min(Number.Ord).assert(strictEqualTo(1)));
    test("min single", ReadonlyNonEmptyArray(2).min(Number.Ord).assert(strictEqualTo(2)));
  });

  suite("mutableClone", () => {
    test("returns a mutable copy", () => {
      const original = ReadonlyNonEmptyArray(1, 2);
      const clone    = original.mutableClone as unknown as Array<number>;
      clone[0]       = 9;
      return original.assert(deepEqualTo([1, 2])) && clone.assert(deepEqualTo([9, 2]));
    });
  });

  suite("reverse", () => {
    test("reverses multiple elements", ReadonlyNonEmptyArray(1, 2, 3).reverse.assert(deepEqualTo([3, 2, 1])));
    test("single element reverse", ReadonlyNonEmptyArray(1).reverse.assert(deepEqualTo([1])));
  });

  suite("sort", () => {
    test(
      "sorts ascending",
      ReadonlyNonEmptyArray(3, 1, 2)
        .sort(Number.Ord)
        .assert(deepEqualTo([1, 2, 3])),
    );
    test(
      "single element",
      ReadonlyNonEmptyArray(1)
        .sort(Number.Ord)
        .assert(deepEqualTo([1])),
    );
    test("does not mutate the original", () => {
      const original = ReadonlyNonEmptyArray(3, 1, 2);
      const sorted   = original.sort(Number.Ord);
      return original.assert(deepEqualTo([3, 1, 2])) && sorted.assert(deepEqualTo([1, 2, 3]));
    });
  });

  suite("uniq", () => {
    test(
      "keeps first occurrences",
      ReadonlyNonEmptyArray(1, 2, 1, 3, 2)
        .uniq(Number.Eq)
        .assert(deepEqualTo([1, 2, 3])),
    );
    test(
      "single element",
      ReadonlyNonEmptyArray(1)
        .uniq(Number.Eq)
        .assert(deepEqualTo([1])),
    );
  });

  suite("traverse", () => {
    test(
      "traverses with Maybe",
      ReadonlyNonEmptyArray(1, 2)
        .traverse(Maybe.Applicative)((n) => Just(n * 2))
        .assert(deepEqualTo(Just([2, 4]))),
    );
    test(
      "short-circuits with Maybe",
      ReadonlyNonEmptyArray(1, 2)
        .traverse(Maybe.Applicative)((n) => (n > 1 ? Nothing() : Just(n)))
        .assert(strictEqualTo(Nothing())),
    );
  });

  suite("traverseWithIndex", () => {
    test(
      "traverses with indexes",
      ReadonlyNonEmptyArray(1, 2)
        .traverseWithIndex(Maybe.Applicative)((i, n) => Just(i + n))
        .assert(deepEqualTo(Just([1, 3]))),
    );
  });

  suite("properties", () => {
    test.io(
      "reverse is involutive",
      Gen.int.array.check((as) => {
        const nea = ReadonlyNonEmptyArray.from([0, ...as]);
        return nea.reverse.reverse.assert(deepEqualTo(nea));
      }),
    );

    test.io(
      "map preserves length",
      Gen.int.array.check((as) => {
        const nea = ReadonlyNonEmptyArray.from([0, ...as]);
        return nea.map((n) => n + 1).length.assert(strictEqualTo(nea.length));
      }),
    );
  });
});
