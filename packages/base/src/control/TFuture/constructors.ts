import type { Either } from "../../data/Either.js";
import type { Maybe } from "../../data/Maybe.js";
import type { USTM } from "../STM.js";

import { Nothing } from "../../data/Maybe.js";
import { TRef } from "../TRef.js";
import { TFuture } from "./definition.js";

/**
 * @tsplus static fncts.control.TFutureOps make
 * @tsplus static fncts.control.TFutureOps __call
 */
export function make<E, A>(): USTM<TFuture<E, A>> {
  return TRef.make<Maybe<Either<E, A>>>(Nothing()).map((_) => TFuture.get(_));
}
