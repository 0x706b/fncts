suite.concurrent("ReadonlyArray", () => {
  suite.concurrent("empty", () => {
    test("returns an empty array", Array.empty<number>().assert(deepEqualTo([])));
  });

  suite.concurrent("makeBy", () => {
    test("constructs by index", Array.makeBy(3, (i) => i).assert(deepEqualTo([0, 1, 2])));
    test("negative count", Array.makeBy(-1, () => 0).assert(deepEqualTo([])));
    test("zero count", Array.makeBy(0, () => 0).assert(deepEqualTo([])));
  });

  suite.concurrent("range", () => {
    test("inclusive ascending", Array.range(1, 3).assert(deepEqualTo([1, 2, 3])));
    test("single element", Array.range(5, 5).assert(deepEqualTo([5])));
    test("descending returns empty", Array.range(3, 1).assert(deepEqualTo([])));
  });

  suite.concurrent("replicate", () => {
    test("replicates value", Array.replicate(3, "a").assert(deepEqualTo(["a", "a", "a"])));
    test("zero times", Array.replicate(0, "a").assert(deepEqualTo([])));
  });

  suite.concurrent("make", () => {
    test("variadic constructor", Array.make(1, 2, 3).assert(deepEqualTo([1, 2, 3])));
  });

  suite.concurrent("asReadonlyArray", () => {
    test("casts mutable array", [1, 2, 3].asReadonlyArray.assert(deepEqualTo([1, 2, 3])));
  });

  suite.concurrent("isEmpty", () => {
    test("empty", [].isEmpty().assert(isTrue));
    test("non-empty", [1].isEmpty().assert(isFalse));
  });

  suite.concurrent("isNonEmpty", () => {
    test("empty", [].isNonEmpty().assert(isFalse));
    test("non-empty", [1].isNonEmpty().assert(isTrue));
  });

  suite.concurrent("length", () => {
    test("empty", [].length.assert(strictEqualTo(0)));
    test("non-empty", [1, 2, 3].length.assert(strictEqualTo(3)));
  });

  suite.concurrent("head", () => {
    test("empty", [].head.assert(strictEqualTo(Nothing())));
    test("non-empty", [1, 2, 3].head.assert(strictEqualTo(Just(1))));
  });

  suite.concurrent("last", () => {
    test("empty", [].last.assert(strictEqualTo(Nothing())));
    test("non-empty", [1, 2, 3].last.assert(strictEqualTo(Just(3))));
  });

  suite.concurrent("init", () => {
    test("empty", [].init.assert(strictEqualTo(Nothing())));
    test("single", [1].init.assert(deepEqualTo(Just([]))));
    test("multiple", [1, 2, 3].init.assert(deepEqualTo(Just([1, 2]))));
  });

  suite.concurrent("tail", () => {
    test("empty", [].tail.assert(strictEqualTo(Nothing())));
    test("single", [1].tail.assert(deepEqualTo(Just([]))));
    test("multiple", [1, 2, 3].tail.assert(deepEqualTo(Just([2, 3]))));
  });

  suite.concurrent("get", () => {
    test("in bounds", [10, 20].get(0).assert(strictEqualTo(Just(10))));
    test("out of bounds high", [10, 20].get(2).assert(strictEqualTo(Nothing())));
    test("negative index", [10, 20].get(-1).assert(strictEqualTo(Nothing())));
  });

  suite.concurrent("unprepend", () => {
    test("empty", [].unprepend.assert(strictEqualTo(Nothing())));
    test("non-empty", [1, 2, 3].unprepend.assert(deepEqualTo(Just([1, [2, 3]] as const))));
  });

  suite.concurrent("append", () => {
    test("appends element", [1, 2].append(3).assert(deepEqualTo([1, 2, 3])));
    test("appends to empty", [].append(1).assert(deepEqualTo([1])));
  });

  suite.concurrent("prepend", () => {
    test("prepends element", [2, 3].prepend(1).assert(deepEqualTo([1, 2, 3])));
    test("prepends to empty", [].prepend(1).assert(deepEqualTo([1])));
  });

  suite.concurrent("prependAll", () => {
    test("intersperse separator before each", [1, 2].prependAll(0).assert(deepEqualTo([0, 1, 0, 2])));
    test("empty", [].prependAll(0).assert(deepEqualTo([])));
  });

  // suite.concurrent("concat", () => {
  //   test("concatenates", [1, 2].concat([3, 4]).assert(deepEqualTo([1, 2, 3, 4])));
  //   test("empty left", [].concat([1, 2]).assert(deepEqualTo([1, 2])));
  //   test("empty right", [1, 2].concat([]).assert(deepEqualTo([1, 2])));
  // });

  suite.concurrent("intersperse", () => {
    test("intersperse between elements", [1, 2, 3].intersperse(0).assert(deepEqualTo([1, 0, 2, 0, 3])));
    test("empty", [].intersperse(0).assert(deepEqualTo([])));
    test("single", [1].intersperse(0).assert(deepEqualTo([1])));
  });

  suite.concurrent("take", () => {
    test("takes prefix", [1, 2, 3, 4].take(2).assert(deepEqualTo([1, 2])));
    test("zero", [1, 2].take(0).assert(deepEqualTo([])));
    test("exceeds length", [1, 2].take(5).assert(deepEqualTo([1, 2])));
  });

  suite.concurrent("takeLast", () => {
    test("takes suffix", [1, 2, 3, 4].takeLast(2).assert(deepEqualTo([3, 4])));
    test("empty", [].takeLast(2).assert(deepEqualTo([])));
  });

  suite.concurrent("drop", () => {
    test("drops prefix", [1, 2, 3, 4].drop(2).assert(deepEqualTo([3, 4])));
    test("zero", [1, 2].drop(0).assert(deepEqualTo([1, 2])));
    test("exceeds length", [1, 2].drop(5).assert(deepEqualTo([])));
  });

  suite.concurrent("dropLast", () => {
    test("drops suffix", [1, 2, 3, 4].dropLast(2).assert(deepEqualTo([1, 2])));
    test("zero", [1, 2].dropLast(0).assert(deepEqualTo([1, 2])));
    test("exceeds length", [1, 2].dropLast(5).assert(deepEqualTo([])));
  });

  suite.concurrent("takeWhile", () => {
    test("takes prefix matching predicate", [1, 2, 3, 4].takeWhile((x) => x < 3).assert(deepEqualTo([1, 2])));
    test("none match", [3, 4].takeWhile((x) => x < 3).assert(deepEqualTo([])));
    test("all match", [1, 2].takeWhile((x) => x < 3).assert(deepEqualTo([1, 2])));
  });

  suite.concurrent("dropWhile", () => {
    test("drops prefix matching predicate", [1, 2, 3, 4].dropWhile((x) => x < 3).assert(deepEqualTo([3, 4])));
    test("none match", [3, 4].dropWhile((x) => x < 3).assert(deepEqualTo([3, 4])));
    test("all match", [1, 2].dropWhile((x) => x < 3).assert(deepEqualTo([])));
  });

  suite.concurrent("dropLastWhile", () => {
    test("drops suffix matching predicate", [1, 2, 3, 4].dropLastWhile((x) => x > 2).assert(deepEqualTo([1, 2])));
    test("none match", [1, 2].dropLastWhile((x) => x > 2).assert(deepEqualTo([1, 2])));
    test("all match", [3, 4].dropLastWhile((x) => x > 2).assert(deepEqualTo([])));
  });

  suite.concurrent("spanIndexLeft", () => {
    test("partial", [1, 2, 3, 4].spanIndexLeft((x) => x < 3).assert(strictEqualTo(2)));
    test("all match", [1, 2].spanIndexLeft((x) => x < 3).assert(strictEqualTo(2)));
    test("none match", [3, 4].spanIndexLeft((x) => x < 3).assert(strictEqualTo(0)));
  });

  suite.concurrent("spanIndexRight", () => {
    test("partial", [1, 2, 3, 4].spanIndexRight((x) => x > 2).assert(strictEqualTo(1)));
    test("all false", [1, 2].spanIndexRight((x) => x > 2).assert(strictEqualTo(1)));
    test("all true", [3, 4].spanIndexRight((x) => x > 2).assert(strictEqualTo(-1)));
  });

  suite.concurrent("spanLeft", () => {
    test("splits at boundary", () => {
      const [init, rest] = [1, 2, 3, 4].spanLeft((x) => x < 3);
      return init.assert(deepEqualTo([1, 2])) && rest.assert(deepEqualTo([3, 4]));
    });
    test("all match", () => {
      const [init, rest] = [1, 2].spanLeft((x) => x < 3);
      return init.assert(deepEqualTo([1, 2])) && rest.assert(deepEqualTo([]));
    });
    test("none match", () => {
      const [init, rest] = [3, 4].spanLeft((x) => x < 3);
      return init.assert(deepEqualTo([])) && rest.assert(deepEqualTo([3, 4]));
    });
  });

  suite.concurrent("spanRight", () => {
    test("splits at boundary", () => {
      const [init, rest] = [1, 2, 3, 4].spanRight((x) => x > 2);
      return init.assert(deepEqualTo([1, 2])) && rest.assert(deepEqualTo([3, 4]));
    });
    test("all false", () => {
      const [init, rest] = [1, 2].spanRight((x) => x > 2);
      return init.assert(deepEqualTo([1, 2])) && rest.assert(deepEqualTo([]));
    });
  });

  suite.concurrent("splitAt", () => {
    test(
      "splits in middle",
      [1, 2, 3, 4].splitAt(2).assert(
        deepEqualTo([
          [1, 2],
          [3, 4],
        ]),
      ),
    );
    test("zero", [1, 2].splitAt(0).assert(deepEqualTo([[], [1, 2]])));
    test("at end", [1, 2].splitAt(2).assert(deepEqualTo([[1, 2], []])));
  });

  suite.concurrent("splitWhere", () => {
    test(
      "splits at predicate",
      [1, 2, 3, 4]
        .splitWhere((x) => x === 3)
        .assert(
          deepEqualTo([
            [1, 2],
            [3, 4],
          ]),
        ),
    );
    test("no match", [1, 2].splitWhere((x) => x === 5).assert(deepEqualTo([[1, 2], []])));
  });

  suite.concurrent("chunksOf", () => {
    test(
      "even chunks",
      [1, 2, 3, 4].chunksOf(2).assert(
        deepEqualTo([
          [1, 2],
          [3, 4],
        ]),
      ),
    );
    test("remainder", [1, 2, 3, 4, 5].chunksOf(2).assert(deepEqualTo([[1, 2], [3, 4], [5]])));
    test("empty", [].chunksOf(2).assert(deepEqualTo([])));
  });

  suite.concurrent("isOutOfBound", () => {
    test("in bounds", [1, 2, 3].isOutOfBound(1).assert(isFalse));
    test("out of bounds high", [1, 2, 3].isOutOfBound(3).assert(isTrue));
    test("negative", [1, 2, 3].isOutOfBound(-1).assert(isTrue));
  });

  suite.concurrent("deleteAt", () => {
    test("in bounds", [1, 2, 3].deleteAt(1).assert(deepEqualTo(Just([1, 3]))));
    test("out of bounds", [1, 2, 3].deleteAt(5).assert(deepEqualTo(Nothing())));
  });

  suite.concurrent("insertAt", () => {
    test("in bounds", [1, 3].insertAt(1, 2).assert(deepEqualTo(Just([1, 2, 3]))));
    test("out of bounds", [1, 3].insertAt(5, 2).assert(deepEqualTo(Nothing())));
  });

  suite.concurrent("updateAt", () => {
    test("in bounds", [1, 2, 3].updateAt(1, 20).assert(deepEqualTo(Just([1, 20, 3]))));
    test("out of bounds", [1, 2, 3].updateAt(5, 20).assert(deepEqualTo(Nothing())));
  });

  suite.concurrent("modifyAt", () => {
    test("in bounds", [1, 2, 3].modifyAt(1, (x) => x * 10).assert(deepEqualTo(Just([1, 20, 3]))));
    test("out of bounds", [1, 2, 3].modifyAt(5, (x) => x * 10).assert(deepEqualTo(Nothing())));
  });

  suite.concurrent("unsafeDeleteAt", () => {
    test("deletes element", [1, 2, 3].unsafeDeleteAt(1).assert(deepEqualTo([1, 3])));
  });

  suite.concurrent("unsafeInsertAt", () => {
    test("inserts element", [1, 3].unsafeInsertAt(1, 2).assert(deepEqualTo([1, 2, 3])));
  });

  suite.concurrent("unsafeUpdateAt", () => {
    test("updates element", [1, 2, 3].unsafeUpdateAt(1, 20).assert(deepEqualTo([1, 20, 3])));
    test("returns same reference when equal", () => {
      const as = [1, 2, 3];
      return as.unsafeUpdateAt(1, 2).assert(strictEqualTo(as));
    });
  });

  suite.concurrent("unsafeModifyAt", () => {
    test("modifies element", [1, 2, 3].unsafeModifyAt(1, (x) => x * 10).assert(deepEqualTo([1, 20, 3])));
  });

  suite.concurrent("unsafeAsMutable", () => {
    test("allows mutation", () => {
      const mut = [1, 2, 3].unsafeAsMutable;
      mut.push(4);
      return mut.assert(deepEqualTo([1, 2, 3, 4]));
    });
  });

  suite.concurrent("mutableClone", () => {
    test("clones array", [1, 2, 3].mutableClone.assert(deepEqualTo([1, 2, 3])));
  });

  suite.concurrent("mutate", () => {
    test("mutates and returns readonly", [1, 2, 3].mutate((xs) => xs.push(4)).assert(deepEqualTo([1, 2, 3, 4])));
  });

  // suite.concurrent("map", () => {
  //   test("maps values", [1, 2, 3].map((x) => x * 2).assert(deepEqualTo([2, 4, 6])));
  //   test("empty", [].map((x) => x * 2).assert(deepEqualTo([])));
  // });

  suite.concurrent("mapWithIndex", () => {
    test("maps with index", ["a", "b"].mapWithIndex((i, a) => `${i}${a}`).assert(deepEqualTo(["0a", "1b"])));
  });

  suite.concurrent("mapAccum", () => {
    test("maps and accumulates", [1, 2, 3].mapAccum(0, (s, a) => [a + s, s + a]).assert(deepEqualTo([[1, 3, 6], 6])));
  });

  // suite.concurrent("flatMap", () => {
  //   test("flatMap", [1, 2].flatMap((x) => [x, x]).assert(deepEqualTo([1, 1, 2, 2])));
  //   test("empty", [].flatMap((x) => [x, x]).assert(deepEqualTo([])));
  // });

  suite.concurrent("flatMapWithIndex", () => {
    test("flatMap with index", ["a", "b"].flatMapWithIndex((i, a) => [i, a]).assert(deepEqualTo([0, "a", 1, "b"])));
  });

  suite.concurrent("flatten", () => {
    test(
      "flattens nested",
      [
        [1, 2],
        [3, 4],
      ].flatten.assert(deepEqualTo([1, 2, 3, 4])),
    );
  });

  // suite.concurrent("reverse", () => {
  //   test("reverses", [1, 2, 3].reverse.assert(deepEqualTo([3, 2, 1])));
  //   test("empty", [].reverse.assert(deepEqualTo([])));
  //   test("single", [1].reverse.assert(deepEqualTo([1])));
  // });

  suite.concurrent("rotate", () => {
    test("positive", [1, 2, 3, 4].rotate(1).assert(deepEqualTo([4, 1, 2, 3])));
    test("negative", [1, 2, 3, 4].rotate(-1).assert(deepEqualTo([2, 3, 4, 1])));
    test("zero", [1, 2, 3].rotate(0).assert(deepEqualTo([1, 2, 3])));
    test("full rotation", [1, 2, 3].rotate(3).assert(deepEqualTo([1, 2, 3])));
  });

  suite.concurrent("scanLeft", () => {
    test("scan left", [1, 2, 3].scanLeft(0, (b, a) => b + a).assert(deepEqualTo([0, 1, 3, 6])));
  });

  suite.concurrent("scanRight", () => {
    test("scan right", [1, 2, 3].scanRight(0, (a, b) => a + b).assert(deepEqualTo([6, 5, 3, 0])));
  });

  suite.concurrent("foldLeft", () => {
    test("sum", [1, 2, 3].foldLeft(0, (b, a) => b + a).assert(strictEqualTo(6)));
    test("empty", [].foldLeft(0, (b, a) => b + a).assert(strictEqualTo(0)));
  });

  suite.concurrent("foldRight", () => {
    test("sum", [1, 2, 3].foldRight(0, (a, b) => a + b).assert(strictEqualTo(6)));
  });

  suite.concurrent("foldLeftWithIndex", () => {
    test("sum with index", [1, 2, 3].foldLeftWithIndex(0, (i, b, a) => b + a + i).assert(strictEqualTo(9)));
  });

  suite.concurrent("foldRightWithIndex", () => {
    test("sum with index", [1, 2, 3].foldRightWithIndex(0, (i, a, b) => a + b + i).assert(strictEqualTo(9)));
  });

  suite.concurrent("foldLeftWhile", () => {
    test(
      "stops when predicate fails",
      [1, 2, 3, 4]
        .foldLeftWhile(
          0,
          (b) => b < 5,
          (b, a) => b + a,
        )
        .assert(strictEqualTo(3)),
    );
  });

  suite.concurrent("foldRighWhile", () => {
    test(
      "stops when predicate fails",
      [1, 2, 3, 4]
        .foldRighWhile(
          0,
          (b) => b < 5,
          (a, b) => a + b,
        )
        .assert(strictEqualTo(7)),
    );
  });

  suite.concurrent("foldLeftWithIndexWhile", () => {
    test(
      "stops when predicate fails",
      [1, 2, 3]
        .foldLeftWithIndexWhile(
          0,
          (b) => b < 5,
          (i, b, a) => b + a + i,
        )
        .assert(strictEqualTo(4)),
    );
  });

  suite.concurrent("foldRightWithIndexWhile", () => {
    test(
      "stops when predicate fails",
      [1, 2, 3]
        .foldRightWithIndexWhile(
          0,
          (b) => b < 5,
          (i, a, b) => a + b + i,
        )
        .assert(strictEqualTo(5)),
    );
  });

  suite.concurrent("fold", () => {
    test("sum", [1, 2, 3].fold(Number.MonoidSum).assert(strictEqualTo(6)));
    test("empty returns nat", [].fold(Number.MonoidSum).assert(strictEqualTo(0)));
  });

  suite.concurrent("foldMap", () => {
    test("sum", [1, 2, 3].foldMap((a) => a, Number.MonoidSum).assert(strictEqualTo(6)));
  });

  suite.concurrent("foldMapWithIndex", () => {
    test("sum with index", [1, 2, 3].foldMapWithIndex((i, a) => a + i, Number.MonoidSum).assert(strictEqualTo(9)));
  });

  suite.concurrent("filter", () => {
    test("keeps matches", [1, 2, 3, 4].filter((x) => x % 2 === 0).assert(deepEqualTo([2, 4])));
    test("none match", [1, 3].filter((x) => x % 2 === 0).assert(deepEqualTo([])));
  });

  suite.concurrent("filterWithIndex", () => {
    test("filters by index", [10, 20, 30].filterWithIndex((i, a) => i === 1).assert(deepEqualTo([20])));
  });

  suite.concurrent("filterMap", () => {
    test(
      "maps and filters",
      [1, 2, 3, 4].filterMap((x) => (x % 2 === 0 ? Just(x) : Nothing())).assert(deepEqualTo([2, 4])),
    );
    test("none", [1, 3].filterMap((x) => (x % 2 === 0 ? Just(x) : Nothing())).assert(deepEqualTo([])));
  });

  suite.concurrent("filterMapWithIndex", () => {
    test(
      "maps and filters by index",
      [10, 20, 30].filterMapWithIndex((i, a) => (i === 1 ? Just(a) : Nothing())).assert(deepEqualTo([20])),
    );
  });

  suite.concurrent("partition", () => {
    test(
      "splits by predicate",
      [1, 2, 3, 4]
        .partition((x) => x % 2 === 0)
        .assert(
          deepEqualTo([
            [1, 3],
            [2, 4],
          ]),
        ),
    );
    test("all false", [1, 3].partition((x) => x % 2 === 0).assert(deepEqualTo([[1, 3], []])));
    test("all true", [2, 4].partition((x) => x % 2 === 0).assert(deepEqualTo([[], [2, 4]])));
  });

  suite.concurrent("partitionWithIndex", () => {
    test("splits by index", [10, 20, 30].partitionWithIndex((i, a) => i === 1).assert(deepEqualTo([[10, 30], [20]])));
  });

  suite.concurrent("partitionMap", () => {
    test(
      "splits by either",
      [1, 2, 3, 4]
        .partitionMap((x) => (x % 2 === 0 ? Either.right(x) : Either.left(x)))
        .assert(
          deepEqualTo([
            [1, 3],
            [2, 4],
          ]),
        ),
    );
  });

  suite.concurrent("partitionMapWithIndex", () => {
    test(
      "splits by either and index",
      [1, 2, 3]
        .partitionMapWithIndex((i, a) => (i === 1 ? Either.right(a) : Either.left(a)))
        .assert(deepEqualTo([[1, 3], [2]])),
    );
  });

  // suite.concurrent("every", () => {
  //   test("all match", [2, 4, 6].every((x) => x % 2 === 0).assert(isTrue));
  //   test("one does not", [2, 3, 6].every((x) => x % 2 === 0).assert(isFalse));
  //   test("empty", [].every((x) => x > 0).assert(isTrue));
  // });

  suite.concurrent("everyWithIndex", () => {
    test("all match", [0, 1, 2].everyWithIndex((i, a) => a === i).assert(isTrue));
    test("one does not", [0, 2, 2].everyWithIndex((i, a) => a === i).assert(isFalse));
  });

  // suite.concurrent("some", () => {
  //   test("one matches", [1, 2, 3].some((x) => x > 2).assert(isTrue));
  //   test("none match", [1, 2, 3].some((x) => x > 5).assert(isFalse));
  //   test("empty", [].some((x) => x > 0).assert(isFalse));
  // });

  // suite.concurrent("find", () => {
  //   test("finds element", [1, 2, 3].find((x) => x > 1).assert(strictEqualTo(Just(2))));
  //   test("none", [1, 2, 3].find((x) => x > 5).assert(strictEqualTo(Nothing())));
  // });

  suite.concurrent("findLast", () => {
    test("finds last match", [1, 2, 3, 2].findLast((x) => x === 2).assert(strictEqualTo(Just(2))));
    test("none", [1, 3].findLast((x) => x === 2).assert(strictEqualTo(Nothing())));
  });

  // suite.concurrent("findIndex", () => {
  //   test("finds index", [1, 2, 3].findIndex((x) => x === 2).assert(strictEqualTo(Just(1))));
  //   test("none", [1, 2, 3].findIndex((x) => x === 5).assert(strictEqualTo(Nothing())));
  // });

  suite.concurrent("findLastIndex", () => {
    test("finds last index", [1, 2, 3, 2].findLastIndex((x) => x === 2).assert(strictEqualTo(Just(3))));
    test("none", [1, 2, 3].findLastIndex((x) => x === 5).assert(strictEqualTo(Nothing())));
  });

  suite.concurrent("findMap", () => {
    test(
      "maps and finds",
      [1, 2, 3].findMap((x) => (x > 1 ? Just(x * 10) : Nothing())).assert(strictEqualTo(Just(20))),
    );
    test("none", [1, 2, 3].findMap((x) => (x > 5 ? Just(x) : Nothing())).assert(strictEqualTo(Nothing())));
  });

  suite.concurrent("findLastMap", () => {
    test(
      "maps and finds last",
      [1, 2, 3].findLastMap((x) => (x > 1 ? Just(x * 10) : Nothing())).assert(strictEqualTo(Just(30))),
    );
  });

  suite.concurrent("findWithIndex", () => {
    test("finds by index", ["a", "b", "c"].findWithIndex((i, a) => i === 1).assert(strictEqualTo(Just("b"))));
    test("none", ["a", "b", "c"].findWithIndex(() => false).assert(strictEqualTo(Nothing())));
  });

  suite.concurrent("findMapWithIndex", () => {
    test(
      "maps and finds by index",
      [10, 20, 30].findMapWithIndex((i, a) => (i === 1 ? Just(a) : Nothing())).assert(strictEqualTo(Just(20))),
    );
  });

  suite.concurrent("findLastMapWithIndex", () => {
    test(
      "maps and finds last by index",
      [10, 20, 30, 20].findLastMapWithIndex((i, a) => (a === 20 ? Just(i) : Nothing())).assert(strictEqualTo(Just(3))),
    );
  });

  suite.concurrent("elem", () => {
    test("element present", [1, 2, 3].elem(2, Number.Eq).assert(isTrue));
    test("element absent", [1, 2, 3].elem(5, Number.Eq).assert(isFalse));
    test("empty", [].elem(1, Number.Eq).assert(isFalse));
  });

  suite.concurrent("sort", () => {
    test("sorts numbers", () => {
      const arr: ReadonlyArray<number> = [3, 1, 2];
      return arr.sort(Number.Ord).assert(deepEqualTo([1, 2, 3]));
    });
    test("empty", () => {
      const arr: ReadonlyArray<number> = [];
      return arr.sort(Number.Ord).assert(deepEqualTo([]));
    });
    test("single", () => {
      const arr: ReadonlyArray<number> = [1];
      return arr.sort(Number.Ord).assert(deepEqualTo([1]));
    });
  });

  suite.concurrent("sortBy", () => {
    test("sorts by provided ords", () => {
      const arr: ReadonlyArray<number> = [3, 1, 2];
      return arr.sortBy([Number.Ord]).assert(deepEqualTo([1, 2, 3]));
    });
  });

  suite.concurrent("uniq", () => {
    test("removes duplicates", [1, 1, 2, 2, 1].uniq(Number.Eq).assert(deepEqualTo([1, 2])));
    test("single", [1].uniq(Number.Eq).assert(deepEqualTo([1])));
    test("empty", [].uniq(Number.Eq).assert(deepEqualTo([])));
  });

  suite.concurrent("difference", () => {
    test("removes elements present in other", [1, 2, 3].difference([2, 3, 4], Number.Eq).assert(deepEqualTo([1])));
    test("empty self", [].difference([1, 2], Number.Eq).assert(deepEqualTo([])));
  });

  suite.concurrent("intersection", () => {
    test("keeps common elements", [1, 2, 3].intersection([2, 3, 4], Number.Eq).assert(deepEqualTo([2, 3])));
    test("empty self", [].intersection([1, 2], Number.Eq).assert(deepEqualTo([])));
  });

  suite.concurrent("union", () => {
    test("combines without duplicates", [1, 2, 3].union([2, 3, 4], Number.Eq).assert(deepEqualTo([1, 2, 3, 4])));
    test("empty other", [1, 2].union([], Number.Eq).assert(deepEqualTo([1, 2])));
  });

  suite.concurrent("group", () => {
    test("groups consecutive equal", [1, 1, 2, 2, 2, 3].group(Number.Eq).assert(deepEqualTo([[1, 1], [2, 2, 2], [3]])));
    test("empty", [].group(Number.Eq).assert(deepEqualTo([])));
  });

  suite.concurrent("groupBy", () => {
    test(
      "groups by key",
      [1, 2, 3, 4].groupBy((x) => (x % 2 === 0 ? "even" : "odd")).assert(deepEqualTo({ odd: [1, 3], even: [2, 4] })),
    );
  });

  suite.concurrent("lefts", () => {
    test("extracts lefts", [Either.left("a"), Either.right(1), Either.left("b")].lefts.assert(deepEqualTo(["a", "b"])));
    test("empty", [].lefts.assert(deepEqualTo([])));
  });

  suite.concurrent("rights", () => {
    test("extracts rights", [Either.left("a"), Either.right(1), Either.right(2)].rights.assert(deepEqualTo([1, 2])));
    test("empty", [].rights.assert(deepEqualTo([])));
  });

  suite.concurrent("zip", () => {
    test(
      "zips pairs",
      [1, 2].zip(["a", "b"]).assert(
        deepEqualTo([
          [1, "a"],
          [2, "b"],
        ]),
      ),
    );
    test("truncates to shorter", [1, 2, 3].zip(["a"]).assert(deepEqualTo([[1, "a"]])));
  });

  suite.concurrent("zipWith", () => {
    test("zips with function", [1, 2].zipWith([10, 20], (a, b) => a + b).assert(deepEqualTo([11, 22])));
  });

  suite.concurrent("cross", () => {
    test(
      "cartesian product",
      [1, 2].cross(["a", "b"]).assert(deepEqualTo([Zipped(1, "a"), Zipped(1, "b"), Zipped(2, "a"), Zipped(2, "b")])),
    );
  });

  suite.concurrent("crossWith", () => {
    test(
      "cartesian with function",
      [1, 2].crossWith(["a", "b"], (a, b) => a + b).assert(deepEqualTo(["1a", "1b", "2a", "2b"])),
    );
  });

  suite.concurrent("align", () => {
    test("aligns to these", [1, 2].align(["a"]).assert(deepEqualTo([These.both(1, "a"), These.left(2)])));
  });

  suite.concurrent("alignWith", () => {
    test(
      "aligns with function",
      [1, 2].alignWith(["a"], (t) => t).assert(deepEqualTo([These.both(1, "a"), These.left(2)])),
    );
  });

  suite.concurrent("alt", () => {
    test("appends on empty", [].alt(() => [1, 2]).assert(deepEqualTo([1, 2])));
    test("appends on non-empty", [1, 2].alt(() => [3, 4]).assert(deepEqualTo([1, 2, 3, 4])));
  });

  suite.concurrent("ap", () => {
    test(
      "applies functions",
      [(x: number) => x + 1, (x: number) => x * 2].ap([1, 2]).assert(deepEqualTo([2, 3, 2, 4])),
    );
  });

  suite.concurrent("join", () => {
    test("joins strings", ["a", "b", "c"].join("-").assert(strictEqualTo("a-b-c")));
    test("empty", [].join(",").assert(strictEqualTo("")));
  });

  suite.concurrent("toIterable", () => {
    test("iterates", () => {
      const out: number[] = [];
      for (const x of [1, 2, 3].toIterable) {
        out.push(x);
      }
      return out.assert(deepEqualTo([1, 2, 3]));
    });
  });

  suite.concurrent("forEach", () => {
    test("side effect", () => {
      const out: number[] = [];
      [1, 2, 3].forEach((x) => out.push(x));
      return out.assert(deepEqualTo([1, 2, 3]));
    });
  });

  suite.concurrent("unzip", () => {
    test(
      "unzips pairs",
      [
        [1, "a"],
        [2, "b"],
      ].unzip.assert(
        deepEqualTo([
          [1, 2],
          ["a", "b"],
        ]),
      ),
    );
  });

  suite.concurrent("collectWhile", () => {
    test(
      "collects while just",
      [1, 2, 3, 4].collectWhile((x) => (x < 3 ? Just(x) : Nothing())).assert(deepEqualTo([1, 2])),
    );
    test(
      "stops at first nothing",
      [3, 1, 2].collectWhile((x) => (x < 3 ? Just(x) : Nothing())).assert(deepEqualTo([])),
    );
  });

  suite.concurrent("chop", () => {
    test("chops into pieces", [1, 2, 3, 4, 5].chop((as) => [as[0]!, as.slice(1)]).assert(deepEqualTo([1, 2, 3, 4, 5])));
    test("empty", [].chop((as) => [as[0]!, as.slice(1)]).assert(deepEqualTo([])));
  });

  suite.concurrent("fromValue", () => {
    test("scalar", Array.fromValue(42).assert(deepEqualTo([42])));
    test("array", Array.fromValue([1, 2]).assert(deepEqualTo([1, 2])));
  });

  suite.concurrent("comprehension", () => {
    test("single input", Array.comprehension([[1, 2]], (a) => a * 2).assert(deepEqualTo([2, 4])));
    test(
      "two inputs",
      Array.comprehension(
        [
          [1, 2],
          [10, 20],
        ],
        (a, b) => a + b,
      ).assert(deepEqualTo([11, 21, 12, 22])),
    );
    test(
      "with guard",
      Array.comprehension(
        [[1, 2, 3]],
        (a) => a,
        (a) => a > 1,
      ).assert(deepEqualTo([2, 3])),
    );
  });

  suite.concurrent("chainRecBreadthFirst", () => {
    test("traverses breadth first", () => {
      const result = Array.chainRecBreadthFirst(1, (a) =>
        a > 3 ? [Either.right(a)] : [Either.left(a + 1), Either.left(a + 2)],
      );
      return result.assert(deepEqualTo([4, 4, 5, 4, 5]));
    });
  });

  suite.concurrent("chainRecDepthFirst", () => {
    test("traverses depth first", () => {
      const result = Array.chainRecDepthFirst(1, (a) =>
        a > 3 ? [Either.right(a)] : [Either.left(a + 1), Either.left(a + 2)],
      );
      return result.assert(deepEqualTo([4, 5, 4, 4, 5]));
    });
  });

  suite.concurrent("traverse", () => {
    test(
      "traverses with Maybe",
      [1, 2, 3]
        .traverse(Maybe.Applicative)((a) => Just(a * 2))
        .assert(deepEqualTo(Just([2, 4, 6]))),
    );
    test(
      "short-circuits on Nothing",
      [1, 2, 3]
        .traverse(Maybe.Applicative)((a) => (a > 1 ? Just(a) : Nothing()))
        .assert(deepEqualTo(Nothing())),
    );
  });

  suite.concurrent("traverseWithIndex", () => {
    test(
      "traverses with index",
      [1, 2, 3]
        .traverseWithIndex(Maybe.Applicative)((i, a) => Just(a + i))
        .assert(deepEqualTo(Just([1, 3, 5]))),
    );
  });

  suite.concurrent("wither", () => {
    test("filters with Eval", () => {
      const result = [1, 2, 3, 4].wither(Eval.Applicative)((a) => Eval.now(a % 2 === 0 ? Just(a) : Nothing()));
      return Eval.run(result).assert(deepEqualTo([2, 4]));
    });
    test("all Nothing returns empty", () => {
      const result = [1, 2, 3].wither(Eval.Applicative)(() => Eval.now(Nothing()));
      return Eval.run(result).assert(deepEqualTo([]));
    });
  });

  suite.concurrent("witherWithIndex", () => {
    test("filters by index", () => {
      const result = [1, 2, 3, 4].witherWithIndex(Eval.Applicative)((i, a) =>
        Eval.now(i % 2 === 0 ? Just(a) : Nothing()),
      );
      return Eval.run(result).assert(deepEqualTo([1, 3]));
    });
  });

  suite.concurrent("wilt", () => {
    test("partitions with Eval", () => {
      const result = [1, 2, 3, 4].wilt(Eval.Applicative)((a) =>
        Eval.now(a % 2 === 0 ? Either.right(a) : Either.left(a)),
      );
      return Eval.run(result).assert(
        deepEqualTo([
          [1, 3],
          [2, 4],
        ]),
      );
    });
  });

  suite.concurrent("wiltWithIndex", () => {
    test("partitions by index", () => {
      const result = [1, 2, 3, 4].wiltWithIndex(Eval.Applicative)((i, a) =>
        Eval.now(i % 2 === 0 ? Either.right(a) : Either.left(a)),
      );
      return Eval.run(result).assert(
        deepEqualTo([
          [2, 4],
          [1, 3],
        ]),
      );
    });
  });

  suite.concurrent("property-based", () => {
    test.io(
      "map identity",
      Gen.int.array.check((as) => as.map((x) => x).assert(deepEqualTo(as as Array<number>))),
    );

    test.io(
      "reverse involution",
      Gen.int.array.check((as) => as.reverse.reverse.assert(deepEqualTo(as))),
    );

    test.io(
      "concat length is sum",
      Gen.int.array
        .zip(Gen.int.array)
        .check(([as, bs]) => as.concat(bs).length.assert(strictEqualTo(as.length + bs.length))),
    );

    test.io(
      "take then drop",
      Gen.int.array.check((as) => {
        const n = Math.floor(as.length / 2);
        return as
          .take(n)
          .concat(as.drop(n))
          .assert(deepEqualTo(as as Array<number>));
      }),
    );

    test.io(
      "filter then length <= original",
      Gen.int.array.check((as) => as.filter(() => true).length.assert(strictEqualTo(as.length))),
    );

    test.io(
      "foldLeft sum matches native",
      Gen.int.array.check((as) => {
        const sum = as.foldLeft(0, (b, a) => b + a);
        return sum.assert(strictEqualTo(as.reduce((b, a) => b + a, 0)));
      }),
    );

    test.io(
      "append increases length",
      Gen.int.array.check((as) => as.append(42).length.assert(strictEqualTo(as.length + 1))),
    );

    test.io(
      "prepend increases length",
      Gen.int.array.check((as) => as.prepend(42).length.assert(strictEqualTo(as.length + 1))),
    );

    test.io(
      "every on generated arrays",
      Gen.intWith({ min: -1000 }).array.check((as) => as.every((x) => x > -1000).assert(isTrue)),
    );
  });
});
