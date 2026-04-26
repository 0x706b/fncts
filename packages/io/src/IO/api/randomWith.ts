/**
 * Accesses the Random service and uses it to produce an effect.
 *
 * @tsplus static fncts.io.IOOps randomWith
 */
export function randomWith<R, E, A>(f: (random: Random) => IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return IOEnv.services.getWith((services) => f(services.get(Random.Tag)));
}

/**
 * Returns the Random service.
 *
 * @tsplus static fncts.io.IOOps random
 */
export const random = IO.randomWith(IO.succeedNow);
