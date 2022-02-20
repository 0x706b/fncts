import type { FIO } from "../../IO";
import type { Fiber } from "../definition";

import { Exit } from "../../../data/Exit";
import { Maybe, Nothing } from "../../../data/Maybe";
import { IO } from "../../IO";

/**
 * Effectfully maps over the value the fiber computes.
 *
 * @tsplus fluent fncts.control.Fiber mapIO
 */
export function mapIO_<E, E1, A, B>(
  fiber: Fiber<E, A>,
  f: (a: A) => FIO<E1, B>
): Fiber<E | E1, B> {
  return {
    _tag: "SyntheticFiber",
    await: fiber.await.chain((exit) => exit.foreachIO(f)),
    getRef: (ref) => fiber.getRef(ref),
    inheritRefs: fiber.inheritRefs,
    interruptAs: (id) =>
      fiber.interruptAs(id).chain((exit) => exit.foreachIO(f)),
    poll: fiber.poll.chain((mexit) =>
      mexit.match(
        () => IO.succeedNow(Nothing()),
        (a) => a.foreachIO(f).map(Maybe.just)
      )
    ),
  };
}

/**
 * Maps over the value the fiber computes.
 *
 * @tsplus fluent fncts.control.Fiber map
 */
export function map_<E, A, B>(fa: Fiber<E, A>, f: (a: A) => B): Fiber<E, B> {
  return fa.mapIO((a) => IO.succeedNow(f(a)));
}
