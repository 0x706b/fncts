/**
 * A fiber that never fails or succeeds
 *
 * @tsplus static fncts.control.FiberOps never
 */
export const never: Fiber<never, never> = {
  _tag: "SyntheticFiber",
  await: IO.never,
  getRef: (fiberRef) => IO.succeedNow(fiberRef.initial),
  interruptAs: () => IO.never,
  inheritRefs: IO.unit,
  poll: IO.succeedNow(Nothing()),
};
