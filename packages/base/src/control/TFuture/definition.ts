import type { Either } from "../../data/Either";
import type { Maybe } from "../../data/Maybe";
import type { NewtypeIso } from "../../data/Newtype";
import type { HKT } from "../../prelude";
import type { UTRef } from "../TRef";

import { Newtype } from "../../data/Newtype";

interface TFutureN extends HKT {
  readonly type: TFuture<this["E"], this["A"]>;
}

/**
 * @tsplus type fncts.control.TFuture
 */
export interface TFuture<E, A>
  extends Newtype<
    {
      readonly TFuture: unique symbol;
    },
    UTRef<Maybe<Either<E, A>>>
  > {}

/**
 * @tsplus type fncts.control.TFutureOps
 */
export interface TFutureOps extends NewtypeIso<TFutureN> {}

export const TFuture: TFutureOps = Newtype<TFutureN>();
