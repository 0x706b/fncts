export const FiberRefsTypeId = Symbol.for("fncts.io.FiberRefs");
export type FiberRefsTypeId = typeof FiberRefsTypeId;

/**
 * @tsplus type fncts.io.FiberRefs
 * @tsplus companion fncts.io.FiberRefsOps
 */
export class FiberRefs {
  readonly _typeId: FiberRefsTypeId = FiberRefsTypeId;
  constructor(readonly fiberRefLocals: HashMap<FiberRef<unknown>, Cons<readonly [FiberId.Runtime, unknown]>>) {}
}
