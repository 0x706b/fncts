import { deepEqualTo } from "@fncts/test/control/Assertion";

class EitherSpec extends DefaultRunnableSpec {
  spec = suite(
    "Either",
    test(
      "ap",
      Either.right((n: number) => n + 1)
        .ap(Either.right(1))
        .assert(strictEqualTo(Either.right(2))),
    ),
    suite(
      "bimap",
      test(
        "left",
        Either.left(1)
          .bimap(
            (n) => n + 1,
            () => undefined,
          )
          .assert(strictEqualTo(Either.left(2))),
      ),
      test(
        "right",
        Either.right(1)
          .bimap(
            () => undefined,
            (n) => n + 1,
          )
          .assert(strictEqualTo(Either.right(2))),
      ),
    ),
    suite(
      "catchAll",
      suite(
        "left",
        test(
          "returning left",
          Either.left(1)
            .catchAll((n) => Either.left(n + 1))
            .assert(strictEqualTo(Either.left(2))),
        ),
        test(
          "returning right",
          Either.left(1)
            .catchAll((n) => Either.right(n + 1))
            .assert(strictEqualTo(Either.right(2))),
        ),
      ),
      suite(
        "right",
        test(
          "returning left",
          Either.right<number, number>(1)
            .catchAll((n) => Either.left(n + 1))
            .assert(strictEqualTo(Either.right(1))),
        ),
        test(
          "returning right",
          Either.right<number, number>(1)
            .catchAll((n) => Either.right(n + 1))
            .assert(strictEqualTo(Either.right(1))),
        ),
      ),
    ),
    suite(
      "catchJust",
      suite(
        "left",
        test(
          "nothing",
          Either.left(1)
            .catchJust(() => Nothing<Either<number, number>>())
            .assert(strictEqualTo(Either.left(1))),
        ),
        test(
          "just",
          Either.left(1)
            .catchJust((n) => Just(Either.right(n + 1)))
            .assert(strictEqualTo(Either.right(2))),
        ),
      ),
      suite(
        "right",
        test(
          "nothing",
          Either.right(1)
            .catchJust(() => Nothing<Either<number, number>>())
            .assert(strictEqualTo(Either.right(1))),
        ),
        test(
          "just",
          Either.right<number, number>(1)
            .catchJust((n) => Just(Either.right(n + 1)))
            .assert(strictEqualTo(Either.right(1))),
        ),
      ),
    ),
    suite(
      "catchMap",
      test(
        "left",
        Either.left(1)
          .catchMap((n) => n + 1)
          .assert(strictEqualTo(Either.right(2))),
      ),
      test(
        "right",
        Either.right<number, number>(1)
          .catchMap((n) => n + 1)
          .assert(strictEqualTo(Either.right(1))),
      ),
    ),
    suite(
      "flatMap",
      suite(
        "left",
        test(
          "returning left",
          Either.left<number, number>(1)
            .flatMap((n) => Either.left(n + 1))
            .assert(strictEqualTo(Either.left(1))),
        ),
        test(
          "returning right",
          Either.left<number, number>(1)
            .flatMap((n) => Either.right(n + 1))
            .assert(strictEqualTo(Either.left(1))),
        ),
      ),
      suite(
        "right",
        test(
          "returning left",
          Either.right<number, number>(1)
            .flatMap((n) => Either.left(n + 1))
            .assert(strictEqualTo(Either.left(2))),
        ),
        test(
          "returning right",
          Either.right<number, number>(1)
            .flatMap((n) => Either.right(n + 1))
            .assert(strictEqualTo(Either.right(2))),
        ),
      ),
    ),
    suite(
      "foldLeft",
      test(
        "left",
        Either.left<number, number>(5)
          .foldLeft(10, (b, a) => b - a)
          .assert(strictEqualTo(10)),
      ),
      test(
        "right",
        Either.right<number, number>(5)
          .foldLeft(10, (b, a) => b - a)
          .assert(strictEqualTo(5)),
      ),
    ),
    suite(
      "foldRight",
      test(
        "left",
        Either.left<number, number>(5)
          .foldRight(10, (a, b) => b - a)
          .assert(strictEqualTo(10)),
      ),
      test(
        "right",
        Either.right<number, number>(5)
          .foldRight(10, (a, b) => b - a)
          .assert(strictEqualTo(5)),
      ),
    ),
    suite(
      "foldMap",
      test(
        "left",
        Either.left<string, string>("a")
          .foldMap((s) => s + "b")
          .assert(strictEqualTo("")),
      ),
      test(
        "right",
        Either.right<string, string>("a")
          .foldMap((s) => s + "b")
          .assert(strictEqualTo("ab")),
      ),
    ),
    suite(
      "getLeft",
      test("left", Either.left<number, number>(1).getLeft.assert(strictEqualTo(Just(1)))),
      test("right", Either.right<number, number>(1).getLeft.assert(strictEqualTo(Nothing()))),
    ),
    suite(
      "getRight",
      test("left", Either.left<number, number>(1).getRight.assert(strictEqualTo(Nothing()))),
      test("right", Either.right<number, number>(1).getRight.assert(strictEqualTo(Just(1)))),
    ),
    suite(
      "getOrElse",
      test(
        "left",
        Either.left<number, number>(0)
          .getOrElse(() => 1)
          .assert(strictEqualTo(1)),
      ),
      test(
        "right",
        Either.right<number, number>(0)
          .getOrElse(() => 1)
          .assert(strictEqualTo(0)),
      ),
    ),
    suite(
      "isEither",
      test("Either", Either.isEither(Either.right(1)).assert(isTrue)),
      test("not Either", Either.isEither(Just(1)).assert(isFalse)),
    ),
    suite(
      "isLeft",
      test("left", Either.left(1).isLeft().assert(isTrue)),
      test("right", Either.right(1).isLeft().assert(isFalse)),
    ),
    suite(
      "isRight",
      test("left", Either.left(1).isRight().assert(isFalse)),
      test("right", Either.right(1).isRight().assert(isTrue)),
    ),
    suite(
      "map",
      test(
        "left",
        Either.left<number, number>(1)
          .map((n) => n.toString())
          .assert(strictEqualTo(Either.left(1))),
      ),
      test(
        "right",
        Either.right<number, number>(1)
          .map((n) => n.toString())
          .assert(strictEqualTo(Either.right("1"))),
      ),
    ),
    suite(
      "mapLeft",
      test(
        "left",
        Either.left<number, number>(1)
          .mapLeft((n) => n.toString())
          .assert(strictEqualTo(Either.left("1"))),
      ),
      test(
        "right",
        Either.right<number, number>(1)
          .mapLeft((n) => n.toString())
          .assert(strictEqualTo(Either.right(1))),
      ),
    ),
    suite(
      "merge",
      test("left", Either.left<number, number>(1).value.assert(strictEqualTo(1))),
      test("right", Either.right<number, number>(1).value.assert(strictEqualTo(1))),
    ),
    suite(
      "orElse",
      test(
        "left",
        Either.left<number, number>(1)
          .orElse(Either.left(2))
          .assert(strictEqualTo(Either.left(2))),
      ),
      test(
        "right",
        Either.right<number, number>(1)
          .orElse(Either.left(2))
          .assert(strictEqualTo(Either.right(1))),
      ),
    ),
    suite(
      "swap",
      test("left", Either.left<number, number>(1).swap.assert(strictEqualTo(Either.right(1)))),
      test("right", Either.right<number, number>(1).swap.assert(strictEqualTo(Either.left(1)))),
    ),
    suite(
      "traverse",
      test(
        "left",
        Either.left<number, number>(1)
          .traverse(Maybe.Applicative)((n) => Just(n))
          .assert(strictEqualTo(Just(Either.left(1)))),
      ),
      test(
        "right",
        Either.right<number, number>(1)
          .traverse(Maybe.Applicative)((n) => Just(n))
          .assert(strictEqualTo(Just(Either.right(1)))),
      ),
    ),
    suite(
      "zipWith",
      suite(
        "left",
        test(
          "left",
          Either.left<number, number>(1)
            .zipWith(Either.left<number, number>(2), (a, b) => a + b)
            .assert(strictEqualTo(Either.left(1))),
        ),
        test(
          "right",
          Either.left<number, number>(1)
            .zipWith(Either.right<number, number>(2), (a, b) => a + b)
            .assert(strictEqualTo(Either.left(1))),
        ),
      ),
      suite(
        "right",
        test(
          "left",
          Either.right<number, number>(1)
            .zipWith(Either.left<number, number>(2), (a, b) => a + b)
            .assert(strictEqualTo(Either.left(2))),
        ),
        test(
          "right",
          Either.right<number, number>(1)
            .zipWith(Either.right<number, number>(2), (a, b) => a + b)
            .assert(strictEqualTo(Either.right(3))),
        ),
      ),
    ),
    suite(
      "zip",
      suite(
        "left",
        test(
          "left",
          Either.left<number, number>(1)
            .zip(Either.left<number, number>(2))
            .assert(strictEqualTo(Either.left(1))),
        ),
        test(
          "right",
          Either.left<number, number>(1)
            .zip(Either.right<number, number>(2))
            .assert(strictEqualTo(Either.left(1))),
        ),
      ),
      suite(
        "right",
        test(
          "left",
          Either.right<number, number>(1)
            .zip(Either.left<number, number>(2))
            .assert(strictEqualTo(Either.left(2))),
        ),
        test(
          "right",
          Either.right<number, number>(1)
            .zip(Either.right<number, number>(2))
            .assert(deepEqualTo(Either.right(Zipped(1, 2)))),
        ),
      ),
    ),
  );
}

export default new EitherSpec();
