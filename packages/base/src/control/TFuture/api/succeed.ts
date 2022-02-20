import type { USTM } from "../../STM";
import type { TFuture } from "../definition";

import { Either } from "../../../data/Either";

/**
 * @tsplus fluent fncts.control.TFuture succeed
 */
export function succeed_<E, A>(self: TFuture<E, A>, a: A): USTM<boolean> {
  return self.done(Either.right(a));
}
