/**
 * Accesses the Clock service and uses it to produce an effect.
 *
 * @tsplus static fncts.io.IOOps clockWith
 */
export function clockWith<R, E, A>(f: (clock: Clock) => IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return IOEnv.services.getWith((services) => f(services.get(Clock.Tag)));
}
/**
 * Returns the Clock service.
 *
 * @tsplus static fncts.io.IOOps clock
 */
export const clock = IO.clockWith(IO.succeedNow);
