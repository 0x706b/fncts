import type { URIO } from "../../../control/IO.js";

import { IO } from "../../../control/IO.js";
import { Exit } from "../definition.js";

/**
 * Applies the function `f` to the successful result of the `Exit` and
 * returns the result in a new `Exit`.
 *
 * @tsplus fluent fncts.data.Exit foreachIO
 */
export function foreachIO_<E2, A2, R, E, A>(
  exit: Exit<E2, A2>,
  f: (a: A2) => IO<R, E, A>,
): IO<R, never, Exit<E | E2, A>> {
  return exit.match(
    (c): URIO<R, Exit<E | E2, A>> => IO.succeedNow(Exit.failCause(c)),
    (a) => f(a).result,
  );
}
