import type { Either } from "../../data/Either.js";
import type { Maybe } from "../../data/Maybe.js";
import type { NewtypeIso } from "../../data/Newtype.js";
import type { HKT } from "../../prelude.js";
import type { UTRef } from "../TRef.js";

import { Newtype } from "../../data/Newtype.js";

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
