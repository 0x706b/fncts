import type {} from "@fncts/base/global";
import type {} from "@fncts/io/global";

import { isRoseTree } from "@fncts/base/collection/immutable/RoseTree";
import { strictNotEqualTo } from "@fncts/test/control/Assertion";

suite.concurrent("RoseTree", () => {
  function T<A>(value: A, ...children: Array<RoseTree<A>>): RoseTree<A> {
    return RoseTree(value, Vector.from(children));
  }

  suite.concurrent("constructors", () => {
    test("make with no children", RoseTree(1).assert(strictEqualTo(RoseTree(1, Vector.empty()))));

    test(
      "make with children",
      RoseTree(1, Vector(RoseTree(2), RoseTree(3))).assert(
        strictEqualTo(RoseTree(1, Vector(RoseTree(2), RoseTree(3)))),
      ),
    );

    test(
      "T helper builds correct tree",
      T(1, T(2), T(3)).assert(strictEqualTo(RoseTree(1, Vector(RoseTree(2), RoseTree(3))))),
    );
  });

  suite.concurrent("isRoseTree", () => {
    test("isRoseTree on tree", isRoseTree(RoseTree(1)).assert(isTrue));

    test("isRoseTree on number", isRoseTree(1).assert(isFalse));

    test("isRoseTree on null", isRoseTree(null).assert(isFalse));

    test("isRoseTree on plain object", isRoseTree({}).assert(isFalse));

    test("isRoseTree on array", isRoseTree([1, 2]).assert(isFalse));
  });

  suite.concurrent("equality", () => {
    test("same tree equal", RoseTree(1).assert(strictEqualTo(RoseTree(1))));

    test("nested equal", T(1, T(2, T(3)), T(4)).assert(strictEqualTo(T(1, T(2, T(3)), T(4)))));

    test("nested different shape not equal", T(1, T(2)).assert(strictNotEqualTo(T(1, T(2, T(3))))));

    test("deep tree equal", T(1, T(2, T(3, T(4)))).assert(strictEqualTo(T(1, T(2, T(3, T(4)))))));

    test("different value not equal", RoseTree(1).assert(strictNotEqualTo(RoseTree(2))));

    test("different children not equal", RoseTree(1, Vector(RoseTree(2))).assert(strictNotEqualTo(RoseTree(1))));
  });

  suite.concurrent("hash", () => {
    test("same tree same hash", T(1, T(2))[Symbol.hash].assert(strictEqualTo(T(1, T(2))[Symbol.hash])));

    test(
      "different tree different hash",
      T(1, T(2))[Symbol.hash].assert(strictEqualTo(T(1, T(3))[Symbol.hash]).invert),
    );
  });

  suite.concurrent("foldLeft", () => {
    test(
      "foldLeft single node",
      RoseTree(1)
        .foldLeft(Vector.empty<number>(), (b, a) => b.append(a))
        .assert(strictEqualTo(Vector(1))),
    );

    test(
      "foldLeft pre-order depth-first",
      T(1, T(2, T(4), T(5)), T(3))
        .foldLeft(Vector.empty<number>(), (b, a) => b.append(a))
        .assert(strictEqualTo(Vector(1, 2, 4, 5, 3))),
    );

    test(
      "foldLeft sum",
      T(1, T(2), T(3))
        .foldLeft(0, (b, a) => b + a)
        .assert(strictEqualTo(6)),
    );

    test(
      "foldLeft string concat",
      T("a", T("b", T("d"), T("e")), T("c"))
        .foldLeft("", (b, a) => b + a)
        .assert(strictEqualTo("abdec")),
    );

    test(
      "foldLeft left-heavy tree",
      T(1, T(2, T(3, T(4))))
        .foldLeft(Vector.empty<number>(), (b, a) => b.append(a))
        .assert(strictEqualTo(Vector(1, 2, 3, 4))),
    );
  });

  suite.concurrent("foldRight", () => {
    test(
      "foldRight single node",
      RoseTree(1)
        .foldRight(Vector.empty<number>(), (a, b) => b.append(a))
        .assert(strictEqualTo(Vector(1))),
    );

    test(
      "foldRight differs from foldLeft",
      T(1, T(2), T(3))
        .foldRight(0, (a, b) => a - b)
        .assert(strictEqualTo(2)),
    );

    test(
      "foldRight on nested",
      T(1, T(2, T(4), T(5)), T(3))
        .foldRight(0, (a, b) => a - b)
        .assert(strictEqualTo(1)),
    );
  });

  suite.concurrent("map", () => {
    test(
      "map identity",
      T(1, T(2), T(3))
        .map((x) => x)
        .assert(strictEqualTo(T(1, T(2), T(3)))),
    );

    test(
      "map transformation",
      T(1, T(2), T(3))
        .map((x) => x * 2)
        .assert(strictEqualTo(T(2, T(4), T(6)))),
    );

    test(
      "map preserves structure",
      T(1, T(2, T(4)), T(3))
        .map((x) => x.toString())
        .assert(strictEqualTo(T("1", T("2", T("4")), T("3")))),
    );

    test(
      "map over deep tree",
      T(1, T(2, T(3, T(4))))
        .map((x) => x + 10)
        .assert(strictEqualTo(T(11, T(12, T(13, T(14)))))),
    );
  });

  suite.concurrent("mapAccum", () => {
    test(
      "mapAccum accumulates state",
      T(1, T(2), T(3))
        .mapAccum(0, (s, a) => [s + a, s + a])
        .assert(deepEqualTo([6, T(1, T(3), T(6))] as const)),
    );

    test(
      "mapAccum preserves structure",
      T("a", T("b", T("c")), T("d"))
        .mapAccum(0, (s, a) => [s + 1, `${s}:${a}`])
        .assert(deepEqualTo([4, T("0:a", T("1:b", T("2:c")), T("3:d"))] as const)),
    );

    test(
      "mapAccum on deep tree",
      T(1, T(2, T(3)))
        .mapAccum(10, (s, a) => [s + a, s * a])
        .assert(deepEqualTo([16, T(10, T(22, T(39)))] as const)),
    );
  });

  suite.concurrent("mapWithIndex", () => {
    test(
      "mapWithIndex assigns pre-order indices",
      T(10, T(20, T(30)), T(40))
        .mapWithIndex((i, a) => `${i}:${a}`)
        .assert(strictEqualTo(T("0:10", T("1:20", T("2:30")), T("3:40")))),
    );

    test(
      "mapWithIndex on deep linear tree",
      T(1, T(2, T(3, T(4))))
        .mapWithIndex((i, a) => i)
        .assert(strictEqualTo(T(0, T(1, T(2, T(3)))))),
    );
  });

  suite.concurrent("unfold", () => {
    test(
      "unfold linear chain",
      RoseTree.unfold(1, (n) => [n, n < 3 ? Vector(n + 1) : Vector.empty()]).assert(strictEqualTo(T(1, T(2, T(3))))),
    );

    test("unfold single node", RoseTree.unfold(42, (n) => [n, Vector.empty()]).assert(strictEqualTo(RoseTree(42))));

    test(
      "unfold binary tree",
      RoseTree.unfold(1, (n) => [n, n < 3 ? Vector(n + 1, n + 2) : Vector.empty()]).assert(
        strictEqualTo(T(1, T(2, T(3), T(4)), T(3))),
      ),
    );
  });

  suite.concurrent("zipWith", () => {
    test(
      "zipWith same shape",
      T(1, T(2), T(3))
        .zipWith(T("a", T("b"), T("c")), (a, b) => `${a}${b}`)
        .assert(strictEqualTo(T("1a", T("2b"), T("3c")))),
    );

    test(
      "zipWith nested same shape",
      T(1, T(2, T(4)), T(3))
        .zipWith(T("a", T("b", T("d")), T("c")), (a, b) => a + b)
        .assert(strictEqualTo(T("1a", T("2b", T("4d")), T("3c")))),
    );

    test(
      "zipWith truncates when left shorter",
      T(1, T(2))
        .zipWith(T("a", T("b", T("c")), T("d")), (a, b) => `${a}${b}`)
        .assert(strictEqualTo(T("1a", T("2b")))),
    );

    test(
      "zipWith truncates when right shorter",
      T(1, T(2, T(4)), T(3))
        .zipWith(T("a", T("b")), (a, b) => `${a}${b}`)
        .assert(strictEqualTo(T("1a", T("2b")))),
    );
  });

  suite.concurrent("zipWithAccum", () => {
    test(
      "zipWithAccum threads state",
      T(1, T(2), T(3))
        .zipWithAccum(T(10, T(20), T(30)), 0, (s, a, b) => [s + a + b, s + a + b])
        .assert(deepEqualTo([66, T(11, T(33), T(66))] as const)),
    );

    test(
      "zipWithAccum on nested",
      T(1, T(2, T(4)), T(3))
        .zipWithAccum(T(10, T(20, T(40)), T(30)), 100, (s, a, b) => [s, `${s}:${a}:${b}`])
        .assert(deepEqualTo([100, T("100:1:10", T("100:2:20", T("100:4:40")), T("100:3:30"))] as const)),
    );
  });

  suite.concurrent("draw", () => {
    test("draw single node", RoseTree("a").draw.assert(strictEqualTo("a")));

    test("draw flat children", T("a", T("b"), T("c")).draw.assert(strictEqualTo("a\n├─ b\n└─ c")));

    test(
      "draw nested",
      T("a", T("b", T("c"), T("d")), T("e")).draw.assert(strictEqualTo("a\n├─ b\n│  ├─ c\n│  └─ d\n└─ e")),
    );

    test(
      "draw deeper nesting",
      T("1", T("2", T("3", T("4")))).draw.assert(strictEqualTo("1\n└─ 2\n   └─ 3\n      └─ 4")),
    );

    test("draw wide tree", T("root", T("a"), T("b"), T("c")).draw.assert(strictEqualTo("root\n├─ a\n├─ b\n└─ c")));
  });

  suite.concurrent("property-based", () => {
    test.io(
      "map identity on flat trees",
      Gen.int.array.check((as) => {
        const tree = RoseTree(0, Vector.from(as.map((a) => RoseTree(a))));
        return tree.map((x) => x).assert(strictEqualTo(tree));
      }),
    );

    test.io(
      "foldLeft sum equals map then sum",
      Gen.int.array.check((as) => {
        const tree     = RoseTree(0, Vector.from(as.map((a) => RoseTree(a))));
        const foldSum  = tree.foldLeft(0, (b, a) => b + a);
        const expected = as.foldLeft(0, (b, a) => b + a);
        return foldSum.assert(strictEqualTo(expected));
      }),
    );

    test.io(
      "unfold then foldLeft identity on chain",
      Gen.int.array.check((arr) => {
        if (arr.length === 0) return true.assert(isTrue);
        // Build a linear chain: root has one child, which has one child, etc.
        const tree = RoseTree.unfold(0, (i) => [i, i < arr.length ? Vector(i + 1) : Vector.empty()]);
        // The tree should have values 0, 1, 2, ..., arr.length
        const values = tree.foldLeft(Vector.empty<number>(), (b, a) => b.append(a));
        return values.assert(strictEqualTo(Vector.range(0, arr.length + 1)));
      }),
    );
  });
});
