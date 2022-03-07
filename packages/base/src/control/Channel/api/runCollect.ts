import type { Conc } from "../../../collection/immutable/Conc";
import type { IO } from "../../IO";
import type { Channel } from "../definition";

/**
 * @tsplus getter fncts.control.Channel runCollect
 */
export function runCollect<Env, InErr, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, unknown, InDone, OutErr, OutElem, OutDone>,
): IO<Env, OutErr, readonly [Conc<OutElem>, OutDone]> {
  return self.doneCollect.run;
}
