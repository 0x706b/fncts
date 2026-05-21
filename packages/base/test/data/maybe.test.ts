suite.concurrent("Maybe", () => {
  suite.concurrent("ap", () => {
    test(
      "Just ap Just",
      Just((n: number) => n + 1)
        .ap(Just(1))
        .assert(strictEqualTo(Just(2))),
    );
    test(
      "Just ap Nothing",
      Just((n: number) => n + 1)
        .ap(Nothing())
        .assert(strictEqualTo(Nothing())),
    );
    test("Nothing ap Just", Nothing<(n: number) => number>().ap(Just(1)).assert(strictEqualTo(Nothing())));
    test("Nothing ap Nothing", Nothing<(n: number) => number>().ap(Nothing()).assert(strictEqualTo(Nothing())));
  });

  suite.concurrent("flatMap", () => {
    test(
      "Just flatMap Just",
      Just(1)
        .flatMap((n) => Just(n + 1))
        .assert(strictEqualTo(Just(2))),
    );
    test(
      "Just flatMap Nothing",
      Just(1)
        .flatMap(() => Nothing())
        .assert(strictEqualTo(Nothing())),
    );
    test(
      "Nothing flatMap Just",
      Nothing<number>()
        .flatMap((n) => Just(n + 1))
        .assert(strictEqualTo(Nothing())),
    );
    test(
      "Nothing flatMap Nothing",
      Nothing<number>()
        .flatMap(() => Nothing())
        .assert(strictEqualTo(Nothing())),
    );
  });

  test(
    "some",
    Just(1)
      .some((n) => n === 1)
      .assert(strictEqualTo(true)) &&
      Just(2)
        .some((n) => n === 1)
        .assert(strictEqualTo(false)) &&
      Nothing<number>()
        .some((n) => n === 1)
        .assert(strictEqualTo(false)),
  );

  test(
    "filter",
    Just(42)
      .filter((n) => n === 42)
      .assert(strictEqualTo(Just(42))) &&
      Just(42)
        .filter((n) => n === 43)
        .assert(strictEqualTo(Nothing())) &&
      Nothing<number>()
        .filter((n) => n === 42)
        .assert(strictEqualTo(Nothing())),
  );
});
