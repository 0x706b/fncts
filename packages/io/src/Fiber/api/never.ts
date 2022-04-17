/**
 * A fiber that never fails or succeeds
 *
 * @tsplus static fncts.io.FiberOps never
 */
export const never: Fiber<never, never> = {
  _tag: "SyntheticFiber",
  await: IO.never,
  interruptAs: () => IO.never,
  inheritRefs: IO.unit,
  poll: IO.succeedNow(Nothing()),
};
