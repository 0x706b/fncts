import type { EnvironmentPatch } from "@fncts/base/data/EnvironmentPatch";

import { environment } from "@fncts/io/IOEnv/definition";

/**
 * @tsplus static fncts.io.IOEnvOps services
 */
export const services: FiberRef.WithPatch<
  Environment<IOEnv>,
  EnvironmentPatch<IOEnv, IOEnv>
> = FiberRef.unsafeMakeEnvironment(environment);
