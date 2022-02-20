import type { Either } from "../../../data/Either";
import type { USTM } from "../../STM";

import { Just } from "../../../data/Maybe";
import { STM } from "../../STM";
import { TFuture } from "../definition";

/**
 * @tsplus fluent fncts.control.TFuture done
 */
export function done_<E, A>(
  self: TFuture<E, A>,
  v: Either<E, A>
): USTM<boolean> {
  return TFuture.reverseGet(self).get.chain((mea) =>
    mea.match(
      () =>
        TFuture.reverseGet(self)
          .set(Just(v))
          .chain(() => STM.succeedNow(true)),
      () => STM.succeedNow(false)
    )
  );
}
