/**
 * Returns an IO whose interruption will be disconnected from the
 * fiber's own interruption, being performed in the background without
 * slowing down the fiber's interruption.
 *
 * This method is useful to create "fast interrupting" effects. For
 * example, if you call this on a bracketed effect, then even if the
 * effect is "stuck" in acquire or release, its interruption will return
 * immediately, while the acquire / release are performed in the
 * background.
 *
 * See timeout and race for other applications.
 *
 * @tsplus getter fncts.io.IO disconnect
 */
export function disconnect<R, E, A>(self: IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return IO.uninterruptibleMask((restore) =>
    IO.fiberId.flatMap((fiberId) =>
      Do((Δ) => {
        const fiber = Δ(restore(self).forkDaemon);
        return Δ(restore(fiber.join).onInterrupt(fiber.interruptAsFork(fiberId)));
      }),
    ),
  );
}
