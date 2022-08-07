/**
 * @tsplus static fncts.io.IOOps randomWith
 */
export function randomWith<R, E, A>(f: (random: Random) => IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return IOEnv.services.getWith((services) => f(services.get(Random.Tag)));
}

/**
 * @tsplus static fncts.io.IOOps random
 */
export const random = IO.randomWith(IO.succeedNow);
