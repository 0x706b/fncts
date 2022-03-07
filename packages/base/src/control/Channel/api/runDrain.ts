import type { IO } from "../../IO";
import type { Channel } from "../definition";

/**
 * Runs a channel until the end is received
 *
 * @tsplus getter fncts.control.Channel runDrain
 */
export function runDrain<Env, InErr, InDone, OutElem, OutErr, OutDone>(
  self: Channel<Env, InErr, unknown, InDone, OutErr, OutElem, OutDone>,
): IO<Env, OutErr, OutDone> {
  return self.drain.run;
}
