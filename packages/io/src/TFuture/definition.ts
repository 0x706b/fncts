import type { UTRef } from "../TRef.js";

interface TFutureN extends HKT {
  readonly [HKT.T]: TFuture<HKT._E<this>, HKT._A<this>>;
}

/**
 * @tsplus type fncts.io.TFuture
 */
export interface TFuture<E, A>
  extends Newtype<
    {
      readonly TFuture: unique symbol;
    },
    UTRef<Maybe<Either<E, A>>>
  > {}

/**
 * @tsplus type fncts.io.TFutureOps
 */
export interface TFutureOps extends NewtypeIso<TFutureN> {}

export const TFuture: TFutureOps = Newtype<TFutureN>();