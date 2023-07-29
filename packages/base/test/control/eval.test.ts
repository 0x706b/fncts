import { vitest } from "vitest";

suite.concurrent("Eval", () => {
  test("now", Eval.now(1).run.assert(strictEqualTo(1)));
  test("defer", () => {
    const fn     = vitest.fn();
    const effect = Eval.defer(() => {
      fn();
      return Eval.now(1);
    });
    const v1      = effect.run;
    const result1 = fn.assert(calledTimes(1)) && v1.assert(strictEqualTo(1));
    const v2      = effect.run;
    const result2 = fn.assert(calledTimes(2)) && v2.assert(strictEqualTo(1));
    return result1 && result2;
  });
  test("always", () => {
    const fn     = vitest.fn();
    const effect = Eval.always(() => {
      fn();
      return 1;
    });
    const v1      = effect.run;
    const result1 = fn.assert(calledTimes(1)) && v1.assert(strictEqualTo(1));
    const v2      = effect.run;
    const result2 = fn.assert(calledTimes(2)) && v2.assert(strictEqualTo(1));
    return result1 && result2;
  });
  test("later", () => {
    const fn     = vitest.fn();
    const effect = Eval.later(() => {
      fn();
      return 1;
    });
    const v1      = effect.run;
    const result1 = fn.assert(calledTimes(1)) && v1.assert(strictEqualTo(1));
    const v2      = effect.run;
    const result2 = fn.assert(calledTimes(1)) && v2.assert(strictEqualTo(1));
    return result1 && result2;
  });
  test(
    "flatMap",
    Eval(1)
      .flatMap((n) => Eval(n + 1))
      .run.assert(strictEqualTo(2)),
  );
  test(
    "map",
    Eval(1)
      .map((n) => n + 1)
      .run.assert(strictEqualTo(2)),
  );
  test(
    "zipWith",
    Eval(1)
      .zipWith(Eval(1), (a, b) => a + b)
      .run.assert(strictEqualTo(2)),
  );
});
