import type { Conc } from "../../../collection/immutable/Conc.js";
import type { IO } from "../../IO.js";
import type { Channel } from "../definition.js";

/**
 * @tsplus getter fncts.control.Channel runCollect
 */
export function runCollect<Env, InErr, InDone, OutErr, OutElem, OutDone>(
  self: Channel<Env, InErr, unknown, InDone, OutErr, OutElem, OutDone>,
): IO<Env, OutErr, readonly [Conc<OutElem>, OutDone]> {
  return self.doneCollect.run;
}
