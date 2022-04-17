/**
 * @tsplus static fncts.io.IOOps clockWith
 */
export function clockWith<R, E, A>(f: (clock: Clock) => IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return IOEnv.services.getWith((services) => f(services.get(Clock.Tag)));
}

/**
 * @tsplus static fncts.io.IOOps clock
 */
export const clock = IO.clockWith(IO.succeedNow);
