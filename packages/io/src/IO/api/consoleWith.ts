import { Console } from "@fncts/io/Console";

/**
 * @tsplus static fncts.io.IOOps consoleWith
 */
export function consoleWith<R, E, A>(f: (console: Console) => IO<R, E, A>): IO<R, E, A> {
  return IOEnv.services.getWith((services) => f(services.get(Console.Tag)));
}

/**
 * @tsplus static fncts.io.IOOps console
 */
export const console = IO.consoleWith(IO.succeedNow);
