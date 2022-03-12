import type { Lazy } from "../../../data/function.js";
import type { RuntimeConfig } from "../../../data/RuntimeConfig.js";

import { IO } from "../definition.js";

/**
 * Runs the specified effect on the specified runtime configuration, restoring
 * the old runtime configuration when it completes execution.
 *
 * @tsplus fluent fncts.control.IO withRuntimeConfig
 */
export function withRuntimeConfig_<R, E, A>(
  self: IO<R, E, A>,
  runtimeConfig: Lazy<RuntimeConfig>,
): IO<R, E, A> {
  return IO.runtimeConfig.chain((currentRuntimeConfig) =>
    IO.setRuntimeConfig(runtimeConfig)
      .apSecond(IO.yieldNow)
      .bracket(
        () => self,
        () => IO.setRuntimeConfig(currentRuntimeConfig),
      ),
  );
}
