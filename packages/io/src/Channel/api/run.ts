/**
 * Runs a channel until the end is received
 *
 * @tsplus getter fncts.io.Channel run
 */
export function run<Env, InErr, InDone, OutErr, OutDone>(
  self: Channel<Env, InErr, unknown, InDone, OutErr, never, OutDone>,
): IO<Env, OutErr, OutDone> {
  return self.runScoped.scoped;
}
