suite.concurrent("Conc", () => {
  suite.concurrent("length", () => {
    test("concatenated size must match length", () => {
      const conc = Conc.empty<number>()
        .concat(Conc.fromArray([1, 2]))
        .concat(Conc(3, 4, 5))
        .concat(Conc.single(6));
      return conc.size.assert(strictEqualTo(conc.length));
    });

    test("empty size must match length", () => {
      const conc = Conc.empty();
      return conc.size.assert(strictEqualTo(conc.length));
    });

    test("fromArray size must match length", () => {
      const conc = Conc.fromArray([1, 2, 3]);
      return conc.size.assert(strictEqualTo(conc.length));
    });

    test("from size must match length", () => {
      const conc = Conc.from(List(1, 2, 3));
      return conc.size.assert(strictEqualTo(conc.length));
    });

    test("single size must match length", () => {
      const conc = Conc.single(true);
      return conc.size.assert(strictEqualTo(conc.length));
    });
  });

  suite.concurrent("append", () => {
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
        const actual   = ImmutableArray.replicate(100, bs).foldLeft(as, addAll);
        const expected = ImmutableArray.replicate(100, bs).foldLeft(as, (bs, as) => bs.concat(as));
        return actual.assert(strictEqualTo(expected));
      });
    });

    test.io("buffer used", () => {
      return Gen.int.conc.zip(Gen.int.conc).check(([as, bs]) => {
        const effect   = IO.succeed(bs.foldLeft(as, (acc, a) => acc.append(a)));
        const actual   = Iterable.replicate(100, effect).traverseIOConcurrent(Function.identity);
        const expected = as.concat(bs);
        return actual.assert(every(strictEqualTo(expected)));
      });
    });

    test.io(
      "equals",
      Gen.int.conc.zip(Gen.int.conc).check(([as, bs]) => {
        const actual   = bs.foldLeft(as, (acc, n) => acc.append(n));
        const expected = as.concat(bs);
        return actual.assert(strictEqualTo(expected));
      }),
    );
  });

  suite.concurrent("prepend", () => {
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
        const actual   = ImmutableArray.replicate(100, as).foldRight(bs, addAll);
        const expected = ImmutableArray.replicate(100, as).foldRight(bs, (as, bs) => as.concat(bs));
        return actual.assert(strictEqualTo(expected));
      });
    });

    test.io(
      "buffer used",
      Gen.int.conc.zip(Gen.int.conc).check(([as, bs]) => {
        const effect   = IO.succeed(as.foldRight(bs, (n, ns) => ns.prepend(n)));
        const actual   = Iterable.replicate(100, effect).traverseIOConcurrent(Function.identity);
        const expected = as.concat(bs);
        return actual.assert(every(strictEqualTo(expected)));
      }),
    );

    test.io(
      "equals",
      Gen.int.conc.zip(Gen.int.conc).check(([as, bs]) => {
        const actual   = as.foldRight(bs, (n, ns) => ns.prepend(n));
        const expected = as.concat(bs);
        return actual.assert(strictEqualTo(expected));
      }),
    );
  });

  test(
    "splitWhere",
    Conc(1, 2, 3, 4)
      .splitWhere((n) => n === 2)
      .assert(deepEqualTo([Conc(1), Conc(2, 3, 4)] as const)),
  );

  test.io(
    "foldLeft",
    Gen.intWith()
      .conc()
      .check((as) => {
        const actual   = as.foldLeft(0, (acc, n) => acc + n);
        const expected = as.toIterable.foldLeft(0, (acc, n) => acc + n);
        return actual.assert(strictEqualTo(expected));
      }),
  );

  test("foldRight", () => {
    const chunk  = Conc("a").concat(Conc("b")).concat(Conc("c"));
    const actual = chunk.foldRight("d", (s, acc) => s + acc);
    return actual.assert(strictEqualTo("abcd"));
  });

  test(
    "mapAccum",
    Conc(1, 1, 1)
      .mapAccum(0, (s, el) => [s + el, s + el])
      .assert(deepEqualTo<readonly [number, Conc<number>]>([3, Conc(1, 2, 3)])),
  );

  test.io(
    "map",
    Gen.int.conc.check((as) => {
      const actual   = as.map((n) => n.toString(10)).toArray;
      const expected = as.toArray.map((n) => n.toString(10));
      return actual.assert(deepEqualTo<ReadonlyArray<string>>(expected));
    }),
  );

  test(
    "flatMap",
    Conc(1, 2, 3)
      .flatMap((n) => Conc(n + 1, n + 2))
      .assert(strictEqualTo(Conc(2, 3, 3, 4, 4, 5))),
  );

  test.io(
    "some",
    Gen.int.conc.check((as) => as.some((n) => n % 2 === 0).assert(strictEqualTo(as.toArray.some((n) => n % 2 === 0)))),
  );

  test.io(
    "filter",
    Gen.int.conc.check((as) =>
      as
        .filter((n) => n % 2 === 0)
        .toArray.assert(deepEqualTo<ReadonlyArray<number>>(as.toArray.filter((n) => n % 2 === 0))),
    ),
  );

  test(
    "drop",
    Conc(1, 2, 3, 4)
      .drop(2)
      .assert(strictEqualTo(Conc(3, 4))),
  );

  test(
    "take",
    Conc(1, 2, 3, 4)
      .take(2)
      .assert(strictEqualTo(Conc(1, 2))),
  );

  test(
    "dropWhile",
    Conc(1, 1, 2, 3, 4)
      .dropWhile((n) => n % 2 !== 0)
      .assert(strictEqualTo(Conc(2, 3, 4))),
  );

  test(
    "takeWhile",
    Conc(1, 1, 2, 3, 4)
      .takeWhile((n) => n % 2 !== 0)
      .assert(strictEqualTo(Conc(1, 1))),
  );

  test.io(
    "filterMap",
    Gen.int.conc.check((as) => {
      const actual   = as.filterMap((n) => (n % 2 === 0 ? Just(n.toString()) : Nothing()));
      const expected = Conc.from(as.toIterable.filterMap((n) => (n % 2 === 0 ? Just(n.toString()) : Nothing())));
      return actual.assert(strictEqualTo(expected));
    }),
  );
});
