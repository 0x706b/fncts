/**
 * Runs a channel until the end is received
 *
 * @tsplus getter fncts.io.Channel runDrain
 */
export function runDrain<Env, InErr, InDone, OutElem, OutErr, OutDone>(
  self: Channel<Env, InErr, unknown, InDone, OutErr, OutElem, OutDone>,
): IO<Env, OutErr, OutDone> {
  return self.drain.run;
}
