import type { Either } from "../../../data/Either";
import type { Maybe } from "../../../data/Maybe";
import type { USTM } from "../../STM";

import { TFuture } from "../definition";

/**
 * @tsplus getter fncts.control.TFuture poll
 */
export function poll<E, A>(self: TFuture<E, A>): USTM<Maybe<Either<E, A>>> {
  return TFuture.reverseGet(self).get;
}
