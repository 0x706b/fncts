interface TSemaphoreN extends HKT {
  readonly type: TSemaphore;
}

/**
 * @tsplus type fncts.io.TSemaphore
 */
export interface TSemaphore
  extends Newtype<
    {
      readonly TSemaphore: unique symbol;
    },
    TRef<number>
  > {}

/**
 * @tsplus type fncts.io.TSemaphoreOps
 */
export interface TSemaphoreOps extends NewtypeIso<TSemaphoreN> {}

export const TSemaphore: TSemaphoreOps = Newtype<TSemaphoreN>();
