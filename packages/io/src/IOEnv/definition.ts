import { Console } from "@fncts/io/Console";

export type IOEnv = Clock | Console | Random;

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
