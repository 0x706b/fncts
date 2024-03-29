import type { TRef } from "../TRef.js";
interface TFutureN extends HKT {
  readonly type: TFuture<this["E"], this["A"]>;
}

/**
 * @tsplus type fncts.io.TFuture
 */
export interface TFuture<E, A>
  extends Newtype<
    {
      readonly TFuture: unique symbol;
    },
    TRef<Maybe<Either<E, A>>>
  > {}

/**
 * @tsplus type fncts.io.TFutureOps
 */
export interface TFutureOps extends NewtypeIso<TFutureN> {}

export const TFuture: TFutureOps = Newtype<TFutureN>();
