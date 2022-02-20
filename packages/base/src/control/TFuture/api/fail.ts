import type { USTM } from "../../STM";
import type { TFuture } from "../definition";

import { Either } from "../../../data/Either";

/**
 * @tsplus fluent fncts.control.TFuture fail
 */
export function fail_<E, A>(self: TFuture<E, A>, e: E): USTM<boolean> {
  return self.done(Either.left(e));
}
