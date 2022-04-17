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

