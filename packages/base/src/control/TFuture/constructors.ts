import type { Either } from "../../data/Either";
import type { Maybe } from "../../data/Maybe";
import type { USTM } from "../STM";

import { Nothing } from "../../data/Maybe";
import { TRef } from "../TRef";
import { TFuture } from "./definition";

/**
 * @tsplus static fncts.control.TFutureOps make
 * @tsplus static fncts.control.TFutureOps __call
 */
export function make<E, A>(): USTM<TFuture<E, A>> {
  return TRef.make<Maybe<Either<E, A>>>(Nothing()).map((_) => TFuture.get(_));
}
