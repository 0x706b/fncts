interface TSemaphoreN extends HKT {
  readonly [HKT.T]: TSemaphore;
}

/**
 * @tsplus type fncts.io.TSemaphore
 */
export interface TSemaphore
  extends Newtype<
    {
      readonly TSemaphore: unique symbol;
    },
    UTRef<number>
  > {}

/**
 * @tsplus type fncts.io.TSemaphoreOps
 */
export interface TSemaphoreOps extends NewtypeIso<TSemaphoreN> {}

export const TSemaphore: TSemaphoreOps = Newtype<TSemaphoreN>();
