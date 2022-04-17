import type { Patch } from "@fncts/base/data/Patch";

import { environment } from "@fncts/io/IOEnv/definition";

/**
 * @tsplus static fncts.io.IOEnvOps services
 */
export const services: FiberRef.WithPatch<Environment<IOEnv>, Patch<IOEnv, IOEnv>> = FiberRef.unsafeMakeEnvironment(
  environment,
);
