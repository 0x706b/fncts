import { FiberRefs } from "@fncts/io/FiberRefs/definition";

/**
 * @tsplus getter fncts.io.FiberRefs fiberRefs
 */
export function fiberRefs(self: FiberRefs): HashSet<FiberRef<unknown>> {
  return self.fiberRefLocals.keySet;
}

/**
 * @tsplus static fncts.io.FiberRefsOps __call
 */
export function make(fiberRefLocals: HashMap<FiberRef<unknown>, Cons<readonly [FiberId.Runtime, unknown]>>): FiberRefs {
  return new FiberRefs(fiberRefLocals);
}

/**
 * @tsplus pipeable fncts.io.FiberRefs forkAs
 */
export function forkAs(childId: FiberId.Runtime) {
  return (self: FiberRefs): FiberRefs => {
    const childFiberRefLocals = self.fiberRefLocals.mapWithIndex((fiberRef, stack) => {
      const oldValue = stack.head[1];
      const newValue = fiberRef.patch(fiberRef.fork)(oldValue);
      if (oldValue === newValue) {
        return stack;
      } else {
        return Cons([childId, newValue], stack);
      }
    });
    return FiberRefs(childFiberRefLocals);
  };
}
