const fiberA = FiberId.synthetic;
const fiberB = FiberId.unsafeMake();
const defect = new Error("defect");

function failA() {
  return Cause.fail("a");
}

function failB() {
  return Cause.fail("b");
}

function haltA() {
  return Cause.halt(defect);
}

function interruptA() {
  return Cause.interrupt(fiberA);
}

function exitFailA<A = never>() {
  return Exit.fail<string, A>("a");
}

function exitFailB<A = never>() {
  return Exit.fail<string, A>("b");
}

suite("Exit", () => {
  suite("constructors", () => {
    test("succeed constructs a success", () => {
      const exit = Exit.succeed(1);
      return exit.isSuccess().assert(isTrue) && exit.getOrThrow.assert(strictEqualTo(1));
    });

    test("succeed stores trace", Exit.succeed(1, "trace").trace!.assert(strictEqualTo("trace")));

    test("fail constructs a typed failure", Exit.fail("a").assert(strictEqualTo(Exit.failCause(failA()))));

    test("failCause constructs a failure", Exit.failCause(failA()).assert(strictEqualTo(exitFailA())));

    test("failCause stores trace", Exit.failCause(failA(), "trace").trace!.assert(strictEqualTo("trace")));

    test("halt constructs a defect failure", Exit.halt(defect).assert(strictEqualTo(Exit.failCause(haltA()))));

    test(
      "interrupt constructs an interrupt failure",
      Exit.interrupt(fiberA).assert(strictEqualTo(Exit.failCause(interruptA()))),
    );

    suite("fromEither", () => {
      test("left", Exit.fromEither(Either.left("a")).assert(strictEqualTo(exitFailA())));
      test("right", Exit.fromEither(Either.right(1)).assert(strictEqualTo(Exit.succeed(1))));
    });

    suite("fromMaybe", () => {
      test("nothing", Exit.fromMaybe(Nothing<number>(), () => "a").assert(strictEqualTo(exitFailA())));
      test("just", Exit.fromMaybe(Just(1), () => "a").assert(strictEqualTo(Exit.succeed(1))));
    });

    test("unit", Exit.unit.assert(strictEqualTo(Exit.succeed(undefined))));
  });

  suite("predicates", () => {
    test("isExit recognizes success", Exit.isExit(Exit.succeed(1)).assert(isTrue));
    test("isExit recognizes failure", Exit.isExit(exitFailA()).assert(isTrue));
    test("isExit rejects non-exit", Exit.isExit({}).assert(isFalse));

    suite("isSuccess", () => {
      test("success", Exit.succeed(1).isSuccess().assert(isTrue));
      test("failure", exitFailA().isSuccess().assert(isFalse));
    });

    suite("isFailure", () => {
      test("success", Exit.succeed(1).isFailure().assert(isFalse));
      test("failure", exitFailA().isFailure().assert(isTrue));
    });

    suite("isInterrupt", () => {
      test("interrupt", Exit.interrupt(fiberA).isInterrupt().assert(isTrue));
      test("typed failure", exitFailA().isInterrupt().assert(isFalse));
      test("success", Exit.succeed(1).isInterrupt().assert(isFalse));
    });
  });

  suite("equality", () => {
    test("successes compare by value", Exit.succeed(1).assert(strictEqualTo(Exit.succeed(1))));
    test(
      "successes with different values are not equal",
      Exit.succeed(1).assert(strictEqualTo(Exit.succeed(2)).invert),
    );
    test("failures compare by cause", exitFailA().assert(strictEqualTo(Exit.failCause(failA()))));
    test("failures with different causes are not equal", exitFailA().assert(strictEqualTo(exitFailB()).invert));
    test("success and failure are not equal", Exit.succeed(1).assert(strictEqualTo(exitFailA()).invert));
  });

  suite("ap", () => {
    test(
      "success function and success value",
      Exit.succeed((n: number) => n + 1)
        .ap(Exit.succeed(1))
        .assert(strictEqualTo(Exit.succeed(2))),
    );
    test("failure function", exitFailA<(n: number) => number>().ap(Exit.succeed(1)).assert(strictEqualTo(exitFailA())));
    test(
      "failure value",
      Exit.succeed((n: number) => n + 1)
        .ap(exitFailA<number>())
        .assert(strictEqualTo(exitFailA())),
    );
  });

  suite("bimap", () => {
    test(
      "failure",
      exitFailA<number>()
        .bimap(
          (s) => s.length,
          (n) => n + 1,
        )
        .assert(strictEqualTo(Exit.fail(1))),
    );
    test(
      "success",
      Exit.succeed<string, number>(1)
        .bimap(
          (s) => s.length,
          (n) => n + 1,
        )
        .assert(strictEqualTo(Exit.succeed(2))),
    );
  });

  suite("causeOrNull", () => {
    test("failure", exitFailA().causeOrNull!.assert(strictEqualTo(failA())));
    test("success", (Exit.succeed(1).causeOrNull === null).assert(isTrue));
  });

  suite("collectAll", () => {
    test("empty", Exit.collectAll(Conc.empty<Exit<string, number>>()).assert(strictEqualTo(Nothing())));
    test(
      "all successes",
      Exit.collectAll(Conc(Exit.succeed(1), Exit.succeed(2))).assert(strictEqualTo(Just(Exit.succeed(Conc(1, 2))))),
    );
    test(
      "one failure",
      Exit.collectAll(Conc(Exit.succeed(1), exitFailA<number>(), Exit.succeed(3))).assert(
        strictEqualTo(Just(exitFailA())),
      ),
    );
    test(
      "multiple failures are sequential",
      Exit.collectAll(Conc(exitFailA<number>(), exitFailB<number>())).assert(
        strictEqualTo(Just(Exit.failCause(Cause.sequential(failA(), failB())))),
      ),
    );
  });

  suite("collectAllConcurrent", () => {
    test("empty", Exit.collectAllConcurrent(Conc.empty<Exit<string, number>>()).assert(strictEqualTo(Nothing())));
    test(
      "all successes",
      Exit.collectAllConcurrent(Conc(Exit.succeed(1), Exit.succeed(2))).assert(
        strictEqualTo(Just(Exit.succeed(Conc(1, 2)))),
      ),
    );
    test(
      "multiple failures are parallel",
      Exit.collectAllConcurrent(Conc(exitFailA<number>(), exitFailB<number>())).assert(
        strictEqualTo(Just(Exit.failCause(Cause.parallel(failA(), failB())))),
      ),
    );
  });

  suite("flatMap", () => {
    test(
      "failure",
      exitFailA<number>()
        .flatMap((n) => Exit.succeed(n + 1))
        .assert(strictEqualTo(exitFailA())),
    );
    test(
      "success to success",
      Exit.succeed(1)
        .flatMap((n) => Exit.succeed(n + 1))
        .assert(strictEqualTo(Exit.succeed(2))),
    );
    test(
      "success to failure",
      Exit.succeed(1)
        .flatMap(() => exitFailA())
        .assert(strictEqualTo(exitFailA())),
    );
  });

  suite("flatten", () => {
    test("outer failure", exitFailA<Exit<string, number>>().flatten.assert(strictEqualTo(exitFailA())));
    test("inner failure", Exit.succeed(exitFailA<number>()).flatten.assert(strictEqualTo(exitFailA())));
    test("nested success", Exit.succeed(Exit.succeed(1)).flatten.assert(strictEqualTo(Exit.succeed(1))));
  });

  suite("getOrThrow", () => {
    test("success", Exit.succeed(1).getOrThrow.assert(strictEqualTo(1)));
    test("failure throws", () => {
      let threw = false;
      try {
        exitFailA().getOrThrow;
      } catch {
        threw = true;
      }
      return threw.assert(isTrue);
    });
  });

  suite("map", () => {
    test(
      "failure",
      exitFailA<number>()
        .map((n) => n + 1)
        .assert(strictEqualTo(exitFailA())),
    );
    test(
      "success",
      Exit.succeed(1)
        .map((n) => n + 1)
        .assert(strictEqualTo(Exit.succeed(2))),
    );
  });

  suite("mapError", () => {
    test(
      "failure",
      exitFailA<number>()
        .mapError((s) => s.length)
        .assert(strictEqualTo(Exit.fail(1))),
    );
    test(
      "success",
      Exit.succeed<string, number>(1)
        .mapError((s) => s.length)
        .assert(strictEqualTo(Exit.succeed(1))),
    );
  });

  suite("mapErrorCause", () => {
    test(
      "failure",
      exitFailA<number>()
        .mapErrorCause(() => haltA())
        .assert(strictEqualTo(Exit.failCause(haltA()))),
    );
    test(
      "success",
      Exit.succeed<string, number>(1)
        .mapErrorCause(() => haltA())
        .assert(strictEqualTo(Exit.succeed(1))),
    );
  });

  suite("match", () => {
    test(
      "failure",
      exitFailA<number>()
        .match(
          (cause) => cause.failureMaybe.getOrElse(() => "none"),
          (n) => `${n}`,
        )
        .assert(strictEqualTo("a")),
    );
    test(
      "success",
      Exit.succeed<string, number>(1)
        .match(
          (cause) => cause.failureMaybe.getOrElse(() => "none"),
          (n) => `${n + 1}`,
        )
        .assert(strictEqualTo("2")),
    );
  });

  suite("value", () => {
    test("failure", (exitFailA<number>().value === undefined).assert(isTrue));
    test("success", Exit.succeed(1).value!.assert(strictEqualTo(1)));
  });

  suite("zip", () => {
    test(
      "success and success",
      Exit.succeed(1)
        .zip(Exit.succeed("a"))
        .getOrThrow.assert(deepEqualTo([1, "a"] as const)),
    );
    test("failure and success", exitFailA<number>().zip(Exit.succeed("a")).assert(strictEqualTo(exitFailA())));
    test("success and failure", Exit.succeed(1).zip(exitFailA<string>()).assert(strictEqualTo(exitFailA())));
    test(
      "failure and failure are sequential",
      exitFailA<number>()
        .zip(exitFailB<string>())
        .assert(strictEqualTo(Exit.failCause(Cause.sequential(failA(), failB())))),
    );
  });

  suite("zipConcurrent", () => {
    test(
      "success and success",
      Exit.succeed(1)
        .zipConcurrent(Exit.succeed("a"))
        .getOrThrow.assert(deepEqualTo([1, "a"] as const)),
    );
    test(
      "failure and failure are parallel",
      exitFailA<number>()
        .zipConcurrent(exitFailB<string>())
        .assert(strictEqualTo(Exit.failCause(Cause.parallel(failA(), failB())))),
    );
  });

  suite("zipLeft", () => {
    test(
      "keeps left value",
      Exit.succeed(1)
        .zipLeft(Exit.succeed("a"))
        .assert(strictEqualTo(Exit.succeed(1))),
    );
    test(
      "combines failures sequentially",
      exitFailA<number>()
        .zipLeft(exitFailB<string>())
        .assert(strictEqualTo(Exit.failCause(Cause.sequential(failA(), failB())))),
    );
  });

  suite("zipLeftConcurrent", () => {
    test(
      "keeps left value",
      Exit.succeed(1)
        .zipLeftConcurrent(Exit.succeed("a"))
        .assert(strictEqualTo(Exit.succeed(1))),
    );
    test(
      "combines failures in parallel",
      exitFailA<number>()
        .zipLeftConcurrent(exitFailB<string>())
        .assert(strictEqualTo(Exit.failCause(Cause.parallel(failA(), failB())))),
    );
  });

  suite("zipRight", () => {
    test(
      "keeps right value",
      Exit.succeed(1)
        .zipRight(Exit.succeed("a"))
        .assert(strictEqualTo(Exit.succeed("a"))),
    );
    test(
      "combines failures sequentially",
      exitFailA<number>()
        .zipRight(exitFailB<string>())
        .assert(strictEqualTo(Exit.failCause(Cause.sequential(failA(), failB())))),
    );
  });

  suite("zipRightConcurrent", () => {
    test(
      "keeps right value",
      Exit.succeed(1)
        .zipRightConcurrent(Exit.succeed("a"))
        .assert(strictEqualTo(Exit.succeed("a"))),
    );
    test(
      "combines failures in parallel",
      exitFailA<number>()
        .zipRightConcurrent(exitFailB<string>())
        .assert(strictEqualTo(Exit.failCause(Cause.parallel(failA(), failB())))),
    );
  });

  suite("zipWith", () => {
    test(
      "success and success",
      Exit.succeed(1)
        .zipWith(Exit.succeed(2), (a, b) => a + b)
        .assert(strictEqualTo(Exit.succeed(3))),
    );
    test(
      "failure and failure are sequential",
      exitFailA<number>()
        .zipWith(exitFailB<number>(), (a, b) => a + b)
        .assert(strictEqualTo(Exit.failCause(Cause.sequential(failA(), failB())))),
    );
  });

  suite("zipWithConcurrent", () => {
    test(
      "success and success",
      Exit.succeed(1)
        .zipWithConcurrent(Exit.succeed(2), (a, b) => a + b)
        .assert(strictEqualTo(Exit.succeed(3))),
    );
    test(
      "failure and failure are parallel",
      exitFailA<number>()
        .zipWithConcurrent(exitFailB<number>(), (a, b) => a + b)
        .assert(strictEqualTo(Exit.failCause(Cause.parallel(failA(), failB())))),
    );
  });

  suite("zipWithCause", () => {
    test(
      "uses custom cause combiner",
      exitFailA<number>()
        .zipWithCause(
          exitFailB<number>(),
          (a, b) => a + b,
          () => haltA(),
        )
        .assert(strictEqualTo(Exit.failCause(haltA()))),
    );
    test(
      "does not call value combiner when left fails",
      exitFailA<number>()
        .zipWithCause(Exit.succeed(2), (a, b) => a + b, Cause.sequential)
        .assert(strictEqualTo(exitFailA())),
    );
    test(
      "does not call value combiner when right fails",
      Exit.succeed(1)
        .zipWithCause(exitFailA<number>(), (a, b) => a + b, Cause.sequential)
        .assert(strictEqualTo(exitFailA())),
    );
  });

  suite("interruption", () => {
    test(
      "different interrupt causes are not equal",
      Exit.interrupt(fiberA).assert(strictEqualTo(Exit.interrupt(fiberB)).invert),
    );
    test(
      "parallel interruption is interrupted",
      Exit.failCause(Cause.parallel(interruptA(), failA())).isInterrupt().assert(isTrue),
    );
  });
});
