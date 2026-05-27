suite("Conc", { timeout: 20_000 }, () => {
  function appended<A>(start: Conc<A>, values: Iterable<A>): Conc<A> {
    return values.toIterable.foldLeft(start, (acc, a) => acc.append(a));
  }

  function prepended<A>(end: Conc<A>, values: Iterable<A>): Conc<A> {
    let out  = end;
    const as = Array.from(values);
    for (let i = as.length - 1; i >= 0; i--) {
      out = out.prepend(as[i]!);
    }
    return out;
  }

  function throws(f: Lazy<void>): boolean {
    try {
      f();
      return false;
    } catch {
      return true;
    }
  }

  suite("constructors", () => {
    test("empty creates an empty Conc", Conc.empty<number>().assert(strictEqualTo(Conc())));

    test("call creates a Conc from arguments", Conc(1, 2, 3).assert(strictEqualTo(Conc.fromArray([1, 2, 3]))));

    test("single creates a singleton Conc", Conc.single(1).assert(strictEqualTo(Conc(1))));

    test("from creates a Conc from an Iterable", Conc.from(List(1, 2, 3)).assert(strictEqualTo(Conc(1, 2, 3))));

    test(
      "fromArray creates a Conc from an array-like value",
      Conc.fromArray([1, 2, 3]).assert(strictEqualTo(Conc(1, 2, 3))),
    );

    test(
      "fromBuffer creates a binary Conc",
      Conc.fromBuffer(new Uint8Array([1, 2, 3])).toArray.assert(deepEqualTo([1, 2, 3])),
    );

    test("range creates an inclusive numeric range", Conc.range(1, 3).assert(strictEqualTo(Conc(1, 2, 3))));

    test("makeBy fills using the index", Conc.makeBy(4, (n) => n * 2).assert(strictEqualTo(Conc(0, 2, 4, 6))));

    test("makeBy with non-positive length is empty", Conc.makeBy(0, (n) => n).assert(strictEqualTo(Conc.empty())));

    test("replicate repeats a value", Conc.replicate(3, "a").assert(strictEqualTo(Conc("a", "a", "a"))));

    test(
      "unfold builds until Nothing",
      Conc.unfold(0, (n) => (n < 3 ? Just([n, n + 1] as const) : Nothing())).assert(strictEqualTo(Conc(0, 1, 2))),
    );
  });

  suite("length / size", () => {
    test("empty size must match length", Conc.empty().size.assert(strictEqualTo(Conc.empty().length)));

    test("single size must match length", Conc.single(true).size.assert(strictEqualTo(Conc.single(true).length)));

    test("fromArray size must match length", Conc.fromArray([1, 2, 3]).size.assert(strictEqualTo(3)));

    test("from size must match length", Conc.from(List(1, 2, 3)).size.assert(strictEqualTo(3)));

    test("concatenated size must match length", () => {
      const conc = Conc.empty<number>()
        .concat(Conc.fromArray([1, 2]))
        .concat(Conc(3, 4, 5))
        .concat(Conc.single(6));
      return conc.size.assert(strictEqualTo(conc.length));
    });
  });

  suite("isEmpty / isNonEmpty", () => {
    test("empty is empty", Conc.empty<number>().isEmpty.assert(isTrue));

    test("empty is not non-empty", Conc.empty<number>().isNonEmpty.assert(isFalse));

    test("non-empty is not empty", Conc(1).isEmpty.assert(isFalse));

    test("non-empty is non-empty", Conc(1).isNonEmpty.assert(isTrue));
  });

  suite("toArray", () => {
    test("empty", Conc.empty<number>().toArray.assert(deepEqualTo([])));

    test("non-empty", Conc(1, 2, 3).toArray.assert(deepEqualTo([1, 2, 3])));

    test.io(
      "matches iteration",
      Gen.int.conc.check((as) => as.toArray.assert(deepEqualTo(Array.from(as)))),
    );
  });

  suite("toBuffer", () => {
    test(
      "returns bytes from a byte Conc",
      Conc.fromBuffer(new Uint8Array([1, 2, 3])).toBuffer.assert(deepEqualTo(new Uint8Array([1, 2, 3]))),
    );
  });

  suite("append", () => {
    test(
      "append to empty",
      Conc.empty<number>()
        .append(1)
        .assert(strictEqualTo(Conc(1))),
    );

    test(
      "append to non-empty",
      Conc(1, 2)
        .append(3)
        .assert(strictEqualTo(Conc(1, 2, 3))),
    );

    test("preserves the original Conc", () => {
      const original = Conc(1, 2);
      const actual   = original.append(3);
      return original.assert(strictEqualTo(Conc(1, 2))) && actual.assert(strictEqualTo(Conc(1, 2, 3)));
    });

    test.io("index", () => {
      const chunksWithIndex = Do((_) => {
        const p  = _(Gen.boolean);
        const as = _(Gen.int.conc);
        const bs = _(Gen.int.concN(1));
        const n  = _(Gen.intWith({ min: 0, max: as.length + bs.length - 1 }));
        return _(Gen.constant(p ? ([as, bs, n] as const) : ([bs, as, n] as const)));
      });
      return chunksWithIndex.check(([as, bs, n]) => {
        const actual   = bs.foldLeft(as, (ns, n) => ns.append(n))[n];
        const expected = as.concat(bs)[n];
        return actual.assert(strictEqualTo(expected));
      });
    });

    test.io("buffer full", () => {
      function addAll<A>(l: Conc<A>, r: Conc<A>): Conc<A> {
        return r.foldLeft(l, (acc, a) => acc.append(a));
      }
      return Gen.int.conc.zip(Gen.int.conc).check(([as, bs]) => {
        const actual   = Array.replicate(100, bs).foldLeft(as, addAll);
        const expected = Array.replicate(100, bs).foldLeft(as, (bs, as) => bs.concat(as));
        return actual.assert(strictEqualTo(expected));
      });
    });

    test.io(
      "buffer used",
      () => {
        return Gen.int.conc.zip(Gen.int.conc).check(([as, bs]) => {
          const effect   = IO.succeed(bs.foldLeft(as, (acc, a) => acc.append(a)));
          const actual   = IO.allConcurrent(Iterable.replicate(100, effect));
          const expected = as.concat(bs);
          return actual.assertIO(every(strictEqualTo(expected)));
        });
      },
      { timeout: 20_000 },
    );

    test.io(
      "equals concat",
      Gen.int.conc.zip(Gen.int.conc).check(([as, bs]) => {
        const actual   = bs.foldLeft(as, (acc, n) => acc.append(n));
        const expected = as.concat(bs);
        return actual.assert(strictEqualTo(expected));
      }),
    );
  });

  suite("prepend", () => {
    test(
      "prepend to empty",
      Conc.empty<number>()
        .prepend(1)
        .assert(strictEqualTo(Conc(1))),
    );

    test(
      "prepend to non-empty",
      Conc(2, 3)
        .prepend(1)
        .assert(strictEqualTo(Conc(1, 2, 3))),
    );

    test("preserves the original Conc", () => {
      const original = Conc(2, 3);
      const actual   = original.prepend(1);
      return original.assert(strictEqualTo(Conc(2, 3))) && actual.assert(strictEqualTo(Conc(1, 2, 3)));
    });

    test.io("index", () => {
      const chunksWithIndex = Do((_) => {
        const p  = _(Gen.boolean);
        const as = _(Gen.int.conc);
        const bs = _(Gen.int.concN(1));
        const n  = _(Gen.intWith({ min: 0, max: as.length + bs.length - 1 }));
        return _(Gen.constant(p ? ([as, bs, n] as const) : ([bs, as, n] as const)));
      });
      return chunksWithIndex.check(([as, bs, n]) => {
        const actual   = as.foldRight(bs, (n, ns) => ns.prepend(n))[n];
        const expected = as.concat(bs)[n];
        return actual.assert(strictEqualTo(expected));
      });
    });

    test.io("buffer full", () => {
      function addAll<A>(l: Conc<A>, r: Conc<A>): Conc<A> {
        return l.foldRight(r, (a, acc) => acc.prepend(a));
      }
      return Gen.int.conc.zip(Gen.int.conc).check(([as, bs]) => {
        const actual   = Array.replicate(100, as).foldRight(bs, addAll);
        const expected = Array.replicate(100, as).foldRight(bs, (as, bs) => as.concat(bs));
        return actual.assert(strictEqualTo(expected));
      });
    });

    test.io(
      "buffer used",
      Gen.int.conc.zip(Gen.int.conc).check(([as, bs]) => {
        const effect   = IO.succeed(as.foldRight(bs, (n, ns) => ns.prepend(n)));
        const actual   = IO.allConcurrent(Iterable.replicate(100, effect));
        const expected = as.concat(bs);
        return actual.assertIO(every(strictEqualTo(expected)));
      }),
    );

    test.io(
      "equals concat",
      Gen.int.conc.zip(Gen.int.conc).check(([as, bs]) => {
        const actual   = as.foldRight(bs, (n, ns) => ns.prepend(n));
        const expected = as.concat(bs);
        return actual.assert(strictEqualTo(expected));
      }),
    );
  });

  suite("concat", () => {
    test(
      "empty on left",
      Conc.empty<number>()
        .concat(Conc(1, 2))
        .assert(strictEqualTo(Conc(1, 2))),
    );

    test(
      "empty on right",
      Conc(1, 2)
        .concat(Conc.empty<number>())
        .assert(strictEqualTo(Conc(1, 2))),
    );

    test(
      "non-empty Conc values",
      Conc(1, 2)
        .concat(Conc(3, 4))
        .assert(strictEqualTo(Conc(1, 2, 3, 4))),
    );

    test.io(
      "matches array concatenation",
      Gen.int.conc
        .zip(Gen.int.conc)
        .check(([as, bs]) => as.concat(bs).toArray.assert(deepEqualTo(as.toArray.concat(bs.toArray)))),
    );
  });

  suite("get / unsafeGet", () => {
    test(
      "get existing index",
      Conc(1, 2, 3)
        .get(1)
        .assert(strictEqualTo(Just(2))),
    );

    test("get missing index", Conc(1, 2, 3).get(9).assert(strictEqualTo(Nothing())));

    test("unsafeGet existing index", Conc(1, 2, 3)[1].assert(strictEqualTo(2)));

    test("unsafeGet missing index throws", throws(() => Conc(1, 2, 3)[9]).assert(isTrue));
  });

  suite("head / unsafeHead", () => {
    test("head on empty", Conc.empty<number>().head.assert(strictEqualTo(Nothing())));

    test("head on non-empty", Conc(1, 2, 3).head.assert(strictEqualTo(Just(1))));

    test("unsafeHead on non-empty", Conc(1, 2, 3).unsafeHead.assert(strictEqualTo(1)));

    test("unsafeHead on empty throws", throws(() => Conc.empty<number>().unsafeHead).assert(isTrue));
  });

  suite("last", () => {
    test("empty", Conc.empty<number>().last.assert(strictEqualTo(Nothing())));

    test("non-empty", Conc(1, 2, 3).last.assert(strictEqualTo(Just(3))));
  });

  suite("tail / unsafeTail", () => {
    test("tail on empty", Conc.empty<number>().tail.assert(strictEqualTo(Nothing())));

    test("tail on non-empty", Conc(1, 2, 3).tail.assert(strictEqualTo(Just(Conc(2, 3)))));

    test("unsafeTail on non-empty", Conc(1, 2, 3).unsafeTail.assert(strictEqualTo(Conc(2, 3))));

    test("unsafeTail on empty throws", throws(() => Conc.empty<number>().unsafeTail).assert(isTrue));
  });

  suite("init", () => {
    test("empty", Conc.empty<number>().init.assert(strictEqualTo(Nothing())));

    test("single", Conc(1).init.assert(strictEqualTo(Just(Conc.empty()))));

    test("multiple", Conc(1, 2, 3).init.assert(strictEqualTo(Just(Conc(1, 2)))));
  });

  suite("take", () => {
    test("negative", Conc(1, 2, 3).take(-1).assert(strictEqualTo(Conc.empty())));

    test("zero", Conc(1, 2, 3).take(0).assert(strictEqualTo(Conc.empty())));

    test(
      "middle",
      Conc(1, 2, 3, 4)
        .take(2)
        .assert(strictEqualTo(Conc(1, 2))),
    );

    test(
      "past end",
      Conc(1, 2, 3)
        .take(9)
        .assert(strictEqualTo(Conc(1, 2, 3))),
    );
  });

  suite("drop", () => {
    test(
      "negative",
      Conc(1, 2, 3)
        .drop(-1)
        .assert(strictEqualTo(Conc(1, 2, 3))),
    );

    test(
      "zero",
      Conc(1, 2, 3)
        .drop(0)
        .assert(strictEqualTo(Conc(1, 2, 3))),
    );

    test(
      "middle",
      Conc(1, 2, 3, 4)
        .drop(2)
        .assert(strictEqualTo(Conc(3, 4))),
    );

    test("past end", Conc(1, 2, 3).drop(9).assert(strictEqualTo(Conc.empty())));
  });

  suite("slice", () => {
    test(
      "middle",
      Conc(1, 2, 3, 4)
        .slice(1, 3)
        .assert(strictEqualTo(Conc(2, 3))),
    );

    test(
      "clamps negative start",
      Conc(1, 2, 3)
        .slice(-10, 2)
        .assert(strictEqualTo(Conc(1, 2))),
    );

    test(
      "clamps end",
      Conc(1, 2, 3)
        .slice(1, 10)
        .assert(strictEqualTo(Conc(2, 3))),
    );

    test("end before start returns empty", Conc(1, 2, 3).slice(2, 1).assert(strictEqualTo(Conc.empty())));
  });

  suite("splitAt", () => {
    test(
      "beginning",
      Conc(1, 2, 3)
        .splitAt(0)
        .assert(deepEqualTo([Conc.empty(), Conc(1, 2, 3)] as const)),
    );

    test(
      "middle",
      Conc(1, 2, 3, 4)
        .splitAt(2)
        .assert(deepEqualTo([Conc(1, 2), Conc(3, 4)] as const)),
    );

    test(
      "end",
      Conc(1, 2, 3)
        .splitAt(9)
        .assert(deepEqualTo([Conc(1, 2, 3), Conc.empty()] as const)),
    );
  });

  suite("splitWhere", () => {
    test(
      "splits before the first matching element",
      Conc(1, 2, 3, 4)
        .splitWhere((n) => n === 2)
        .assert(deepEqualTo([Conc(1), Conc(2, 3, 4)] as const)),
    );

    test(
      "no match",
      Conc(1, 2, 3)
        .splitWhere((n) => n === 9)
        .assert(deepEqualTo([Conc(1, 2, 3), Conc.empty()] as const)),
    );
  });

  suite("chunksOf", () => {
    test(
      "splits into chunks",
      Conc(1, 2, 3, 4, 5)
        .chunksOf(2)
        .assert(strictEqualTo(Conc(Conc(1, 2), Conc(3, 4), Conc(5)))),
    );
  });

  suite("dropUntil", () => {
    test(
      "drops through the matching element",
      Conc(1, 2, 3, 4)
        .dropUntil((n) => n === 3)
        .assert(strictEqualTo(Conc(4))),
    );

    test(
      "no match drops all elements",
      Conc(1, 2, 3)
        .dropUntil((n) => n === 9)
        .assert(strictEqualTo(Conc.empty())),
    );
  });

  suite("dropWhile", () => {
    test(
      "drops prefix while predicate holds",
      Conc(1, 1, 2, 3, 4)
        .dropWhile((n) => n % 2 !== 0)
        .assert(strictEqualTo(Conc(2, 3, 4))),
    );

    test(
      "empty",
      Conc.empty<number>()
        .dropWhile(() => true)
        .assert(strictEqualTo(Conc.empty())),
    );
  });

  suite("takeWhile", () => {
    test(
      "takes prefix while predicate holds",
      Conc(1, 1, 2, 3, 4)
        .takeWhile((n) => n % 2 !== 0)
        .assert(strictEqualTo(Conc(1, 1))),
    );

    test(
      "empty",
      Conc.empty<number>()
        .takeWhile(() => true)
        .assert(strictEqualTo(Conc.empty())),
    );
  });

  suite("map", () => {
    test(
      "maps values",
      Conc(1, 2, 3)
        .map((n) => n.toString())
        .assert(strictEqualTo(Conc("1", "2", "3"))),
    );

    test.io(
      "matches Array.map",
      Gen.int.conc.check((as) => {
        const actual   = as.map((n) => n.toString(10)).toArray;
        const expected = as.toArray.map((n) => n.toString(10));
        return actual.assert(deepEqualTo<ReadonlyArray<string>>(expected));
      }),
    );
  });

  suite("mapWithIndex", () => {
    test(
      "maps with indexes",
      Conc("a", "b", "c")
        .mapWithIndex((i, a) => `${i}:${a}`)
        .assert(strictEqualTo(Conc("0:a", "1:b", "2:c"))),
    );

    test(
      "maps concatenated Conc values with correct indexes",
      Conc("a")
        .concat(Conc("b", "c"))
        .mapWithIndex((i, a) => `${i}:${a}`)
        .assert(strictEqualTo(Conc("0:a", "1:b", "2:c"))),
    );
  });

  suite("mapAccum", () => {
    test(
      "maps while accumulating state",
      Conc(1, 1, 1)
        .mapAccum(0, (s, el) => [s + el, s + el])
        .assert(deepEqualTo<readonly [number, Conc<number>]>([3, Conc(1, 2, 3)])),
    );
  });

  suite("flatMap", () => {
    test(
      "flat maps values",
      Conc(1, 2, 3)
        .flatMap((n) => Conc(n + 1, n + 2))
        .assert(strictEqualTo(Conc(2, 3, 3, 4, 4, 5))),
    );

    test(
      "empty",
      Conc.empty<number>()
        .flatMap((n) => Conc(n))
        .assert(strictEqualTo(Conc.empty())),
    );
  });

  suite("flatten", () => {
    test(
      "flattens nested Conc values",
      Conc(Conc(1, 2), Conc(3), Conc.empty<number>()).flatten.assert(strictEqualTo(Conc(1, 2, 3))),
    );
  });

  suite("filter", () => {
    test(
      "filters values",
      Conc(1, 2, 3, 4)
        .filter((n) => n % 2 === 0)
        .assert(strictEqualTo(Conc(2, 4))),
    );

    test.io(
      "matches Array.filter",
      Gen.int.conc.check((as) =>
        as
          .filter((n) => n % 2 === 0)
          .toArray.assert(deepEqualTo<ReadonlyArray<number>>(as.toArray.filter((n) => n % 2 === 0))),
      ),
    );
  });

  suite("filterWithIndex", () => {
    test(
      "filters with indexes",
      Conc("a", "b", "c", "d")
        .filterWithIndex((i, _) => i % 2 === 0)
        .assert(strictEqualTo(Conc("a", "c"))),
    );
  });

  suite("filterMap", () => {
    test(
      "filters and maps values",
      Conc(1, 2, 3, 4)
        .filterMap((n) => (n % 2 === 0 ? Just(n.toString()) : Nothing()))
        .assert(strictEqualTo(Conc("2", "4"))),
    );

    test.io(
      "matches Iterable.filterMap",
      Gen.int.conc.check((as) => {
        const actual   = as.filterMap((n) => (n % 2 === 0 ? Just(n.toString()) : Nothing()));
        const expected = Conc.from(as.toIterable.filterMap((n) => (n % 2 === 0 ? Just(n.toString()) : Nothing())));
        return actual.assert(strictEqualTo(expected));
      }),
    );
  });

  suite("filterMapWithIndex", () => {
    test(
      "filters and maps with indexes",
      Conc("a", "b", "c")
        .filterMapWithIndex((i, a) => (i % 2 === 0 ? Just(`${i}:${a}`) : Nothing()))
        .assert(strictEqualTo(Conc("0:a", "2:c"))),
    );
  });

  suite("compact", () => {
    test("removes Nothing values", Conc(Just(1), Nothing<number>(), Just(3)).compact.assert(strictEqualTo(Conc(1, 3))));
  });

  suite("collectWhile", () => {
    test(
      "collects until the first Nothing",
      Conc(1, 2, 3, 4)
        .collectWhile((n) => (n < 3 ? Just(n.toString()) : Nothing()))
        .assert(strictEqualTo(Conc("1", "2"))),
    );
  });

  suite("some", () => {
    test(
      "true when an element matches",
      Conc(1, 3, 4)
        .some((n) => n % 2 === 0)
        .assert(isTrue),
    );

    test(
      "false when no element matches",
      Conc(1, 3, 5)
        .some((n) => n % 2 === 0)
        .assert(isFalse),
    );

    test.io(
      "matches Array.some",
      Gen.int.conc.check((as) =>
        as.some((n) => n % 2 === 0).assert(strictEqualTo(as.toArray.some((n) => n % 2 === 0))),
      ),
    );
  });

  suite("elem", () => {
    test("true when present", Conc(1, 2, 3).elem(2).assert(isTrue));

    test("false when absent", Conc(1, 2, 3).elem(9).assert(isFalse));
  });

  suite("find", () => {
    test(
      "found",
      Conc(1, 2, 3)
        .find((n) => n > 1)
        .assert(strictEqualTo(Just(2))),
    );

    test(
      "not found",
      Conc(1, 2, 3)
        .find((n) => n > 9)
        .assert(strictEqualTo(Nothing())),
    );
  });

  suite("foldLeft", () => {
    test(
      "folds left",
      Conc(1, 2, 3)
        .foldLeft(0, (acc, n) => acc + n)
        .assert(strictEqualTo(6)),
    );

    test.io(
      "matches Iterable.foldLeft",
      Gen.intWith()
        .conc()
        .check((as) => {
          const actual   = as.foldLeft(0, (acc, n) => acc + n);
          const expected = as.toIterable.foldLeft(0, (acc, n) => acc + n);
          return actual.assert(strictEqualTo(expected));
        }),
    );
  });

  suite("foldLeftWithIndex", () => {
    test(
      "folds left with indexes",
      Conc(1, 2, 3)
        .foldLeftWithIndex("", (i, acc, n) => acc + `${i}:${n};`)
        .assert(strictEqualTo("0:1;1:2;2:3;")),
    );
  });

  suite("foldLeftWhile", () => {
    test(
      "stops before folding when predicate fails",
      Conc(1, 2, 3, 4)
        .foldLeftWhile(
          0,
          (b) => b < 5,
          (b, a) => b + a,
        )
        .assert(strictEqualTo(6)),
    );
  });

  suite("foldRight", () => {
    test("folds right", () => {
      const chunk  = Conc("a").concat(Conc("b")).concat(Conc("c"));
      const actual = chunk.foldRight("d", (s, acc) => s + acc);
      return actual.assert(strictEqualTo("abcd"));
    });
  });

  suite("foldRightWithIndex", () => {
    test(
      "folds right with indexes",
      Conc("a", "b", "c")
        .foldRightWithIndex("", (i, a, acc) => `${i}:${a};` + acc)
        .assert(strictEqualTo("0:a;1:b;2:c;")),
    );
  });

  suite("foldMap", () => {
    test(
      "fold maps",
      Conc("a", "bb", "ccc")
        .foldMap((s) => s.length, Number.MonoidSum)
        .assert(strictEqualTo(6)),
    );
  });

  suite("forEach", () => {
    test("visits all elements", () => {
      const visited: Array<number> = [];
      Conc(1, 2, 3).forEach((n) => visited.push(n));
      return visited.assert(deepEqualTo([1, 2, 3]));
    });
  });

  suite("forEachWithIndex", () => {
    test("visits all elements with indexes", () => {
      const visited: Array<string> = [];
      Conc("a", "b", "c").forEachWithIndex((i, a) => visited.push(`${i}:${a}`));
      return visited.assert(deepEqualTo(["0:a", "1:b", "2:c"]));
    });
  });

  suite("join", () => {
    test("empty", Conc.empty<string>().join(",").assert(strictEqualTo("")));

    test("non-empty", Conc("a", "b", "c").join(",").assert(strictEqualTo("a,b,c")));
  });

  suite("reverse", () => {
    test("iterates in reverse", Array.from(Conc(1, 2, 3).reverse).assert(deepEqualTo([3, 2, 1])));
  });

  suite("updateAt / unsafeUpdateAt", () => {
    test(
      "updateAt updates an existing index",
      Conc(1, 2, 3)
        .updateAt(1, 9)
        .assert(strictEqualTo(Just(Conc(1, 9, 3)))),
    );

    test(
      "updateAt returns Nothing for a negative index",
      Conc(1, 2, 3).updateAt(-1, 9).assert(strictEqualTo(Nothing())),
    );

    test(
      "updateAt returns Nothing for an index past the end",
      Conc(1, 2, 3).updateAt(9, 9).assert(strictEqualTo(Nothing())),
    );

    test(
      "unsafeUpdateAt updates an existing index",
      Conc(1, 2, 3)
        .unsafeUpdateAt(1, 9)
        .assert(strictEqualTo(Conc(1, 9, 3))),
    );

    test("unsafeUpdateAt missing index throws", throws(() => Conc(1, 2, 3).unsafeUpdateAt(9, 9)).assert(isTrue));

    test(
      "later updates win",
      Conc(1, 2, 3)
        .unsafeUpdateAt(1, 9)
        .unsafeUpdateAt(1, 8)
        .assert(strictEqualTo(Conc(1, 8, 3))),
    );
  });

  suite("zip", () => {
    test(
      "zips to shortest length",
      Conc(1, 2, 3)
        .zip(Conc("a", "b"))
        .toArray.assert(
          deepEqualTo([
            [1, "a"],
            [2, "b"],
          ]),
        ),
    );

    test("empty when either side is empty", Conc.empty<number>().zip(Conc("a")).assert(strictEqualTo(Conc.empty())));
  });

  suite("zipWith", () => {
    test(
      "zips with a function",
      Conc(1, 2, 3)
        .zipWith(Conc(4, 5), (a, b) => a + b)
        .assert(strictEqualTo(Conc(5, 7))),
    );
  });

  suite("zipWithIndex", () => {
    test(
      "zips values with indexes",
      Conc("a", "b", "c").zipWithIndex.toArray.assert(
        deepEqualTo([
          ["a", 0],
          ["b", 1],
          ["c", 2],
        ]),
      ),
    );
  });

  suite("zipWithIndexOffset", () => {
    test(
      "zips values with offset indexes",
      Conc("a", "b", "c")
        .zipWithIndexOffset(2)
        .toArray.assert(
          deepEqualTo([
            ["a", 2],
            ["b", 3],
            ["c", 4],
          ]),
        ),
    );
  });

  suite("align", () => {
    test(
      "aligns both sides",
      Conc(1, 2)
        .align(Conc("a", "b", "c"))
        .toArray.assert(deepEqualTo([These.both(1, "a"), These.both(2, "b"), These.right("c")])),
    );
  });

  suite("alignWith", () => {
    test(
      "aligns and maps",
      Conc(1, 2, 3)
        .alignWith(Conc("a"), (these) =>
          these.match(
            (n) => `left:${n}`,
            (s) => `right:${s}`,
            (n, s) => `both:${n}:${s}`,
          ),
        )
        .assert(strictEqualTo(Conc("both:1:a", "left:2", "left:3"))),
    );
  });

  suite("partition", () => {
    test(
      "partitions values",
      Conc(1, 2, 3, 4)
        .partition((n) => n % 2 === 0)
        .assert(deepEqualTo([Conc(1, 3), Conc(2, 4)] as const)),
    );
  });

  suite("partitionWithIndex", () => {
    test(
      "partitions with indexes",
      Conc("a", "b", "c", "d")
        .partitionWithIndex((i, _) => i % 2 === 0)
        .assert(deepEqualTo([Conc("b", "d"), Conc("a", "c")] as const)),
    );
  });

  suite("partitionMap", () => {
    test(
      "partitions mapped Either values",
      Conc(1, 2, 3, 4)
        .partitionMap((n) => (n % 2 === 0 ? Either.right(n.toString()) : Either.left(n)))
        .assert(deepEqualTo([Conc(1, 3), Conc("2", "4")] as const)),
    );
  });

  suite("partitionMapWithIndex", () => {
    test(
      "partitions mapped Either values with indexes",
      Conc("a", "b", "c")
        .partitionMapWithIndex((i, a) => (i % 2 === 0 ? Either.right(`${i}:${a}`) : Either.left(`${i}:${a}`)))
        .assert(deepEqualTo([Conc("1:b"), Conc("0:a", "2:c")] as const)),
    );
  });

  suite("separate", () => {
    test(
      "separates Either values",
      Conc(Either.left("e1"), Either.right(1), Either.left("e2"), Either.right(2)).separate.assert(
        deepEqualTo([Conc("e1", "e2"), Conc(1, 2)] as const),
      ),
    );
  });

  suite("traverse", () => {
    test(
      "succeeds when all effects succeed",
      Conc(1, 2, 3)
        .traverse(Maybe.Applicative)((n) => Just(n * 2))
        .assert(strictEqualTo(Just(Conc(2, 4, 6)))),
    );

    test(
      "fails when any effect fails",
      Conc(1, 2, 3)
        .traverse(Maybe.Applicative)((n) => (n === 2 ? Nothing() : Just(n)))
        .assert(strictEqualTo(Nothing())),
    );
  });

  suite("traverseWithIndex", () => {
    test(
      "traverses with indexes",
      Conc(1, 2, 3)
        .traverseWithIndex(Maybe.Applicative)((i, n) => Just(i + n))
        .assert(strictEqualTo(Just(Conc(1, 3, 5)))),
    );
  });

  suite("corresponds", () => {
    test(
      "true when lengths and elements correspond",
      Conc(1, 2, 3)
        .corresponds(Conc(2, 4, 6), (a, b) => b === a * 2)
        .assert(isTrue),
    );

    test(
      "false when lengths differ",
      Conc(1, 2)
        .corresponds(Conc(2, 4, 6), (a, b) => b === a * 2)
        .assert(isFalse),
    );

    test(
      "false when an element does not correspond",
      Conc(1, 2, 3)
        .corresponds(Conc(2, 5, 6), (a, b) => b === a * 2)
        .assert(isFalse),
    );
  });

  suite("is", () => {
    test("true for Conc", Conc.is(Conc(1, 2, 3)).assert(isTrue));

    test("false for non-Conc", Conc.is([1, 2, 3]).assert(isFalse));
  });

  suite("large and mixed representations", () => {
    test(
      "many appends match array order",
      appended(Conc.empty<number>(), Array.range(0, 200)).toArray.assert(deepEqualTo(Array.range(0, 200))),
    );

    test(
      "many prepends match array order",
      prepended(Conc.empty<number>(), Array.range(0, 200)).toArray.assert(deepEqualTo(Array.range(0, 200))),
    );

    test("nested concatenations preserve order", () => {
      const actual = Array.range(0, 50).foldLeft(Conc.empty<number>(), (acc, n) => acc.concat(Conc(n)));
      return actual.toArray.assert(deepEqualTo(Array.range(0, 50)));
    });

    test(
      "append can transition from binary to non-binary",
      Conc.fromBuffer(new Uint8Array([1, 2]))
        .append("x")
        .toArray.assert(deepEqualTo([1, 2, "x"])),
    );

    test(
      "append buffer can transition from binary to non-binary",
      Conc.fromBuffer(new Uint8Array([1]))
        .append(2)
        .append("x")
        .toArray.assert(deepEqualTo([1, 2, "x"])),
    );

    test(
      "prepend can transition from binary to non-binary",
      Conc.fromBuffer(new Uint8Array([1, 2]))
        .prepend("x")
        .toArray.assert(deepEqualTo(["x", 1, 2])),
    );

    test(
      "prepend buffer can transition from binary to non-binary",
      Conc.fromBuffer(new Uint8Array([2]))
        .prepend(1)
        .prepend("x")
        .toArray.assert(deepEqualTo(["x", 1, 2])),
    );
  });
});
