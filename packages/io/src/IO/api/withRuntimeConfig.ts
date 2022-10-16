/**
 * Runs the specified effect on the specified runtime configuration, restoring
 * the old runtime configuration when it completes execution.
 *
 * @tsplus pipeable fncts.io.IO withRuntimeConfig
 */
export function withRuntimeConfig(runtimeConfig: Lazy<RuntimeConfig>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<R, E, A> => {
    return IO.runtimeConfig.flatMap((currentRuntimeConfig) =>
      IO.setRuntimeConfig(runtimeConfig)
        .zipRight(IO.yieldNow)
        .bracket(
          () => self,
          () => IO.setRuntimeConfig(currentRuntimeConfig),
        ),
    );
  };
}
