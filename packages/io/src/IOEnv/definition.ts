import type { Patch } from "@fncts/base/data/Patch";

import { Console } from "@fncts/io/Console";

export type IOEnv = Has<Clock> & Has<Console> & Has<Random>;

/**
 * @tsplus type fncts.io.IOEnvOps
 */
export interface IOEnvOps {}

export const IOEnv: IOEnvOps = {};

/**
 * @tsplus static fncts.io.IOEnvOps environment
 */
export const environment = Environment()
  .add(Clock.Live, Clock.Tag)
  .add(Random.Live, Random.Tag)
  .add(Console.Live, Console.Tag);
