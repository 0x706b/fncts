import { Console } from "@fncts/io/Console";

/**
 * @tsplus static fncts.io.IOEnvOps Live
 */
export const live = Layer.succeed(Clock.Live, Clock.Tag)
  .and(Layer.succeed(Random.Live, Random.Tag))
  .and(Layer.succeed(Console.Live, Console.Tag));
