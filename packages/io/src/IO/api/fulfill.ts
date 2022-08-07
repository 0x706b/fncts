/**
 * Returns an IO that keeps or breaks a promise based on the result of
 * this effect. Synchronizes interruption, so if this effect is interrupted,
 * the specified promise will be interrupted, too.
 *
 * @tsplus fluent fncts.io.IO fulfill
 */
export function fulfill_<R, E, A>(effect: IO<R, E, A>, p: Future<E, A>, __tsplusTrace?: string): IO<R, never, boolean> {
  return IO.uninterruptibleMask(({ restore }) => restore(effect).result.flatMap((exit) => p.done(exit)));
}
