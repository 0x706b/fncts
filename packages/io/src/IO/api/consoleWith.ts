import { Console } from "@fncts/io/Console";
/**
 * Accesses the Console service and uses it to produce an effect.
 *
 * @tsplus static fncts.io.IOOps consoleWith
 */
export function consoleWith<R, E, A>(f: (console: Console) => IO<R, E, A>, __tsplusTrace?: string): IO<R, E, A> {
  return IOEnv.services.getWith((services) => f(services.get(Console.Tag)));
}
/**
 * Returns the Console service.
 *
 * @tsplus static fncts.io.IOOps console
 */
export const console = IO.consoleWith(IO.succeedNow);
