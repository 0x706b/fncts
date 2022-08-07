/**
 * Runs the specified effect on the specified runtime configuration, restoring
 * the old runtime configuration when it completes execution.
 *
 * @tsplus fluent fncts.io.IO withRuntimeConfig
 */
export function withRuntimeConfig_<R, E, A>(
  self: IO<R, E, A>,
  runtimeConfig: Lazy<RuntimeConfig>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return IO.runtimeConfig.flatMap((currentRuntimeConfig) =>
    IO.setRuntimeConfig(runtimeConfig)
      .apSecond(IO.yieldNow)
      .bracket(
        () => self,
        () => IO.setRuntimeConfig(currentRuntimeConfig),
      ),
  );
}
