import { STM } from "../../STM";
import { TFuture } from "../definition";

/**
 * @tsplus getter fncts.control.TFuture await
 */
export function wait<E, A>(self: TFuture<E, A>): STM<unknown, E, A> {
  return TFuture.reverseGet(self).get.filterMapSTM((mea) =>
    mea.map(STM.fromEitherNow)
  );
}
