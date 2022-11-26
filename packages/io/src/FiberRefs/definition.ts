export interface FiberRefsN extends HKT {
  readonly type: FiberRefs;
}

/**
 * @tsplus type fncts.io.FiberRefs
 */
export interface FiberRefs
  extends Newtype<
    { readonly FiberRefs: unique symbol },
    HashMap<FiberRef<any>, Cons<readonly [FiberId.Runtime, unknown]>>
  > {}

/**
 * @tsplus type fncts.io.FiberRefsOps
 */
export interface FiberRefsOps extends NewtypeIso<FiberRefsN> {}

export const FiberRefs: FiberRefsOps = Newtype();
