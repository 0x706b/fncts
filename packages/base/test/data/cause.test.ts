import { failed, flipCauseOption, isCause } from "@fncts/base/data/Cause";
import { containsString, isJust, isLeft, isNothing, isRight } from "@fncts/test/control/Assertion";

const traceA = Trace(FiberId.synthetic, Conc.empty());
const traceB = Trace(FiberId.none, Conc.empty());
const fiberA = FiberId.synthetic;
const fiberB = FiberId.unsafeMake();
const defect = new Error("defect");

function failA() {
  return Cause.fail("a", traceA);
}

function failB() {
  return Cause.fail("b", traceB);
}

function haltA() {
  return Cause.halt(defect, traceA);
}

function interruptA() {
  return Cause.interrupt(fiberA, traceA);
}

suite("Cause", () => {
  suite("isCause", () => {
    test("recognizes causes", isCause(Cause.empty()).assert(isTrue));
    test("rejects non-causes", isCause({}).assert(isFalse));
  });

  suite("empty", () => {
    test("constructs empty cause", Cause.empty().isEmpty.assert(isTrue));
    test("is singleton", Cause.empty().assert(strictEqualTo(Cause.empty())));
  });

  suite("fail", () => {
    test("constructs typed failure", Cause.fail("a", traceA).assert(strictEqualTo(failA())));
    test("stores value and trace", () => {
      const cause = Cause.fail("a", traceA);
      return (
        cause.failureMaybe.assert(isJust(strictEqualTo("a"))) &&
        cause.failureTraceMaybe.assert(isJust(deepEqualTo(["a", traceA] as const)))
      );
    });
  });

  suite("halt", () => {
    test("constructs defect", Cause.halt(defect, traceA).assert(strictEqualTo(haltA())));
    test("stores value and trace", () => {
      const cause = Cause.halt(defect, traceA);
      return (
        cause.isHalt().assert(isTrue) &&
        cause.haltMaybe.assert(isJust(strictEqualTo(defect))) &&
        cause.isTraced.assert(isTrue)
      );
    });
  });

  suite("interrupt", () => {
    test("constructs interruption", Cause.interrupt(fiberA, traceA).assert(strictEqualTo(interruptA())));
    test("stores fiber id and trace", () => {
      const cause = Cause.interrupt(fiberA, traceA);
      return (
        cause.isInterrupt().assert(isTrue) &&
        cause.interruptOption.assert(isJust(strictEqualTo(fiberA))) &&
        cause.isTraced.assert(isTrue)
      );
    });
  });

  suite("sequential", () => {
    test("combines non-empty causes", Cause.sequential(failA(), failB()).isThen().assert(isTrue));
    test("left empty is identity", Cause.sequential(Cause.empty(), failA()).assert(strictEqualTo(failA())));
    test("right empty is identity", Cause.sequential(failA(), Cause.empty()).assert(strictEqualTo(failA())));
  });

  suite("parallel", () => {
    test("combines non-empty causes", Cause.parallel(failA(), failB()).isBoth().assert(isTrue));
    test("left empty is identity", Cause.parallel(Cause.empty(), failA()).assert(strictEqualTo(failA())));
    test("right empty is identity", Cause.parallel(failA(), Cause.empty()).assert(strictEqualTo(failA())));
  });

  suite("stackless", () => {
    test("wraps cause", Cause.stackless(failA(), true).assert(strictEqualTo(failA())));
    test(
      "stores stackless flag",
      Cause.stackless(failA(), true)
        .fold({
          Empty: () => false,
          Fail: () => false,
          Halt: () => false,
          Interrupt: () => false,
          Then: () => false,
          Both: () => false,
          Stackless: (_, stackless) => stackless,
        })
        .assert(isTrue),
    );
  });

  suite("as", () => {
    test(
      "maps failures to constant",
      failA()
        .as(() => 1)
        .assert(strictEqualTo(Cause.fail(1, traceA))),
    );
    test(
      "preserves defects",
      haltA()
        .as(() => 1)
        .assert(strictEqualTo(haltA())),
    );
  });

  suite("map", () => {
    test(
      "maps typed failures",
      failA()
        .map((s) => s.length)
        .assert(strictEqualTo(Cause.fail(1, traceA))),
    );
    test(
      "preserves interrupts",
      interruptA()
        .map(() => 1)
        .assert(strictEqualTo(interruptA())),
    );
  });

  suite("flatMap", () => {
    test(
      "flatMaps typed failures",
      failA()
        .flatMap((s) => Cause.fail(s.length, traceB))
        .assert(strictEqualTo(Cause.fail(1, traceA))),
    );
    test(
      "preserves defects",
      haltA()
        .flatMap(() => failB())
        .assert(strictEqualTo(haltA())),
    );
    test(
      "recurses through sequential causes",
      Cause.sequential(failA(), failB())
        .flatMap((s) => Cause.fail(s.length))
        .failures.assert(strictEqualTo(List(1, 1))),
    );
  });

  suite("flatten", () => {
    test("flattens nested typed failures", Cause.fail(failA()).flatten.assert(strictEqualTo(failA())));
  });

  suite("contains", () => {
    test("contains self", Cause.sequential(failA(), failB()).contains(failA()).assert(isTrue));
    test("does not contain absent cause", Cause.sequential(failA(), failB()).contains(Cause.fail("c")).assert(isFalse));
  });

  suite("defects", () => {
    test(
      "extracts halt values",
      Cause.parallel(haltA(), Cause.halt("boom")).defects.toArray.assert(deepEqualTo([defect, "boom"])),
    );
    test(
      "ignores failures and interrupts",
      Cause.parallel(failA(), interruptA()).defects.assert(strictEqualTo(List())),
    );
  });

  suite("failed", () => {
    test("true when a failure exists", failed(Cause.parallel(haltA(), failA())).assert(isTrue));
    test("false without failures", failed(Cause.parallel(haltA(), interruptA())).assert(isFalse));
  });

  suite("failures", () => {
    test("extracts typed failures", Cause.sequential(failA(), failB()).failures.assert(strictEqualTo(List("a", "b"))));
    test(
      "ignores defects and interrupts",
      Cause.parallel(haltA(), interruptA()).failures.assert(strictEqualTo(List())),
    );
  });

  suite("failureMaybe", () => {
    test("returns first failure", Cause.sequential(failA(), failB()).failureMaybe.assert(isJust(strictEqualTo("a"))));
    test("returns nothing when absent", haltA().failureMaybe.assert(isNothing));
  });

  suite("failureTraceMaybe", () => {
    test(
      "returns first failure and trace",
      failA().failureTraceMaybe.assert(isJust(deepEqualTo(["a", traceA] as const))),
    );
    test("returns nothing when absent", interruptA().failureTraceMaybe.assert(isNothing));
  });

  suite("failureOrCause", () => {
    test("returns first failure", failA().failureOrCause.assert(isLeft(strictEqualTo("a"))));
    test("returns cause when no failure", interruptA().failureOrCause.assert(isRight(strictEqualTo(interruptA()))));
  });

  suite("failureTraceOrCause", () => {
    test(
      "returns first failure and trace",
      failA().failureTraceOrCause.assert(isLeft(deepEqualTo(["a", traceA] as const))),
    );
    test(
      "returns cause when no failure",
      interruptA().failureTraceOrCause.assert(isRight(strictEqualTo(interruptA()))),
    );
  });

  suite("halted", () => {
    test("true when halt exists", Cause.parallel(failA(), haltA()).halted.assert(isTrue));
    test("false without halt", Cause.parallel(failA(), interruptA()).halted.assert(isFalse));
  });

  suite("haltMaybe", () => {
    test("returns first defect", haltA().haltMaybe.assert(isJust(strictEqualTo(defect))));
    test("returns nothing when absent", failA().haltMaybe.assert(isNothing));
  });

  suite("interrupted", () => {
    test("true when interrupt exists", Cause.parallel(failA(), interruptA()).interrupted.assert(isTrue));
    test("false without interrupt", Cause.parallel(failA(), haltA()).interrupted.assert(isFalse));
  });

  suite("interruptOption", () => {
    test("returns first interruptor", interruptA().interruptOption.assert(isJust(strictEqualTo(fiberA))));
    test("returns nothing when absent", failA().interruptOption.assert(isNothing));
  });

  suite("interruptors", () => {
    test(
      "collects interruptors",
      Cause.parallel(Cause.interrupt(fiberA), Cause.interrupt(fiberB)).interruptors.size.assert(strictEqualTo(2)),
    );
    test("ignores non-interrupts", Cause.parallel(failA(), haltA()).interruptors.size.assert(strictEqualTo(0)));
  });

  suite("interruptedOnly", () => {
    test(
      "true for only interrupts",
      Cause.parallel(Cause.interrupt(fiberA), Cause.interrupt(fiberB)).interruptedOnly.assert(isTrue),
    );
    test("false when failure exists", Cause.parallel(interruptA(), failA()).interruptedOnly.assert(isFalse));
  });

  suite("isInterrupted", () => {
    test("true when interrupt exists", Cause.parallel(failA(), interruptA()).isInterrupted.assert(isTrue));
    test("false without interrupt", failA().isInterrupted.assert(isFalse));
  });

  suite("isInterruptedOnly", () => {
    test(
      "true for only interrupts",
      Cause.sequential(Cause.interrupt(fiberA), Cause.interrupt(fiberB)).isInterruptedOnly.assert(isTrue),
    );
    test("false when defect exists", Cause.parallel(interruptA(), haltA()).isInterruptedOnly.assert(isFalse));
  });

  suite("isEmpty", () => {
    test("true for empty", Cause.empty().isEmpty.assert(isTrue));
    test("false for failure", failA().isEmpty.assert(isFalse));
    test(
      "true for composed empties",
      Cause.parallel(Cause.empty(), Cause.sequential(Cause.empty(), Cause.empty())).isEmpty.assert(isTrue),
    );
  });

  suite("isBoth", () => {
    test("true for parallel", Cause.parallel(failA(), failB()).isBoth().assert(isTrue));
    test("false for failure", failA().isBoth().assert(isFalse));
  });

  suite("isThen", () => {
    test("true for sequential", Cause.sequential(failA(), failB()).isThen().assert(isTrue));
    test("false for failure", failA().isThen().assert(isFalse));
  });

  suite("isFail", () => {
    test("true for fail", failA().isFail().assert(isTrue));
    test("false for halt", haltA().isFail().assert(isFalse));
  });

  suite("isHalt", () => {
    test("true for halt", haltA().isHalt().assert(isTrue));
    test("false for fail", failA().isHalt().assert(isFalse));
  });

  suite("isInterrupt", () => {
    test("true for interrupt", interruptA().isInterrupt().assert(isTrue));
    test("false for fail", failA().isInterrupt().assert(isFalse));
  });

  suite("isFailure", () => {
    test("true when failure exists", Cause.parallel(failA(), haltA()).isFailure.assert(isTrue));
    test("false when failure is absent", haltA().isFailure.assert(isFalse));
  });

  suite("isTraced", () => {
    test("true when non-empty trace exists", failA().isTraced.assert(isTrue));
    test("false for Trace.none", Cause.fail("a").isTraced.assert(isFalse));
  });

  suite("find", () => {
    test(
      "finds first matching value",
      Cause.sequential(failA(), failB())
        .find((cause) => (cause.isFail() ? Just(cause.value) : Nothing()))
        .assert(isJust(strictEqualTo("a"))),
    );
    test(
      "returns nothing when no value matches",
      haltA()
        .find((cause) => (cause.isFail() ? Just(cause.value) : Nothing()))
        .assert(isNothing),
    );
  });

  suite("foldLeft", () => {
    test(
      "accumulates over every node",
      Cause.sequential(failA(), failB())
        .foldLeft(0, (n) => Just(n + 1))
        .assert(strictEqualTo(3)),
    );
    test(
      "keeps state when callback returns nothing",
      failA()
        .foldLeft(1, () => Nothing<number>())
        .assert(strictEqualTo(1)),
    );
  });

  suite("fold", () => {
    test(
      "folds all cases",
      Cause.sequential(failA(), Cause.parallel(haltA(), interruptA()))
        .fold({
          Empty: () => "empty",
          Fail: (e) => `fail:${e}`,
          Halt: () => "halt",
          Interrupt: () => "interrupt",
          Then: (l, r) => `then(${l},${r})`,
          Both: (l, r) => `both(${l},${r})`,
          Stackless: (z) => z,
        })
        .assert(strictEqualTo("then(fail:a,both(halt,interrupt))")),
    );
  });

  suite("filterDefects", () => {
    test(
      "removes matching defects",
      Cause.parallel(haltA(), failA())
        .filterDefects((u) => u === defect)
        .assert(isJust(strictEqualTo(failA()))),
    );
    test(
      "returns nothing when all leaves are removed",
      haltA()
        .filterDefects((u) => u === defect)
        .assert(isNothing),
    );
  });

  suite("stripSomeDefects", () => {
    test(
      "removes selected defects",
      Cause.parallel(haltA(), failA())
        .stripSomeDefects((u) => u === defect)
        .assert(isJust(strictEqualTo(failA()))),
    );
    test(
      "keeps unselected defects",
      haltA()
        .stripSomeDefects(() => false)
        .assert(isJust(strictEqualTo(haltA()))),
    );
  });

  suite("keepDefects", () => {
    test("keeps only defects", Cause.parallel(haltA(), failA()).keepDefects.assert(isJust(strictEqualTo(haltA()))));
    test("returns nothing when no defects exist", Cause.parallel(failA(), interruptA()).keepDefects.assert(isNothing));
  });

  suite("stripFailures", () => {
    test("removes typed failures", Cause.parallel(failA(), haltA()).stripFailures.assert(strictEqualTo(haltA())));
    test(
      "preserves interrupts",
      Cause.parallel(failA(), interruptA()).stripFailures.assert(strictEqualTo(interruptA())),
    );
  });

  suite("flipCauseEither", () => {
    test(
      "returns right when any failure is right",
      Cause.fail(Either.right<string, number>(1)).flipCauseEither.assert(isRight(strictEqualTo(1))),
    );
    test(
      "returns left with failures when all are left",
      Cause.parallel(
        Cause.fail(Either.left<string, number>("a")),
        Cause.fail(Either.left<string, number>("b")),
      ).flipCauseEither.assert(isLeft(strictEqualTo(Cause.parallel(Cause.fail("a"), Cause.fail("b"))))),
    );
  });

  suite("flipCauseOption", () => {
    test(
      "drops nothing failures",
      flipCauseOption(Cause.parallel(Cause.fail(Nothing<string>()), Cause.fail(Just("a")))).assert(
        isJust(strictEqualTo(Cause.fail("a"))),
      ),
    );
    test(
      "returns nothing when all failures are nothing",
      flipCauseOption(Cause.fail(Nothing<string>())).assert(isNothing),
    );
  });

  suite("sequenceCauseEither", () => {
    test(
      "returns right when any failure is right",
      Cause.fail(Either.right<string, number>(1)).sequenceCauseEither.assert(isRight(strictEqualTo(1))),
    );
    test(
      "returns left with failures when all are left",
      Cause.sequential(
        Cause.fail(Either.left<string, number>("a")),
        Cause.fail(Either.left<string, number>("b")),
      ).sequenceCauseEither.assert(isLeft(strictEqualTo(Cause.sequential(Cause.fail("a"), Cause.fail("b"))))),
    );
  });

  suite("sequenceCauseMaybe", () => {
    test(
      "drops nothing failures",
      Cause.parallel(Cause.fail(Nothing<string>()), Cause.fail(Just("a"))).sequenceCauseMaybe.assert(
        isJust(strictEqualTo(Cause.fail("a"))),
      ),
    );
    test(
      "returns nothing when all failures are nothing",
      Cause.fail(Nothing<string>()).sequenceCauseMaybe.assert(isNothing),
    );
  });

  suite("mapTrace", () => {
    test(
      "maps traces on leaf failures",
      failA()
        .mapTrace(() => traceB)
        .assert(strictEqualTo(Cause.fail("a", traceB))),
    );
    test(
      "recurses through composed causes",
      Cause.parallel(failA(), interruptA())
        .mapTrace(() => traceB)
        .isTraced.assert(isTrue),
    );
  });

  suite("traced", () => {
    test("combines trace with existing traces", Cause.traced(Cause.fail("a"), traceA).isTraced.assert(isTrue));
  });

  suite("untraced", () => {
    test("removes all traces", failA().untraced.isTraced.assert(isFalse));
  });

  suite("linearize", () => {
    test("linearizes parallel branches", Cause.parallel(failA(), failB()).linearize.size.assert(strictEqualTo(2)));
    test(
      "keeps sequential combinations",
      Cause.sequential(failA(), failB()).linearize.has(Cause.sequential(failA(), failB())).assert(isTrue),
    );
  });

  suite("unified", () => {
    test(
      "converts leaves to unified entries",
      Cause.parallel(failA(), interruptA()).unified.length.assert(strictEqualTo(2)),
    );
    test("includes failure message", failA().unified.unsafeHead.message.join("\n").assert(containsString("a")));
  });

  suite("prettyPrint", () => {
    test("renders failure message", failA().prettyPrint.assert(containsString("Exception in fiber")));
    test(
      "renders suppressed failures",
      Cause.parallel(failA(), failB()).prettyPrint.assert(containsString("Suppressed:")),
    );
  });

  suite("squashWith", () => {
    test(
      "uses typed failure when present",
      (failA().squashWith((s) => new Error(s)) as Error).message.assert(strictEqualTo("a")),
    );
    test(
      "uses defect when no typed failure is present",
      (haltA().squashWith(() => new Error("unused")) as Error).assert(strictEqualTo(defect)),
    );
  });
});
