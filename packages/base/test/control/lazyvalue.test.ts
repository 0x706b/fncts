import { vitest } from "vitest";

suite.concurrent("LazyValue", () => {
  test("Returns result of getValue without computing more than once", () => {
    const fn        = vitest.fn();
    const lazyValue = LazyValue(() => {
      fn();
      return 1;
    });
    lazyValue.value;
    const value = lazyValue.value;
    return value.assert(strictEqualTo(1)) && fn.assert(calledTimes(1));
  });
});
