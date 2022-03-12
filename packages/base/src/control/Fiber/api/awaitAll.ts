import type { Conc } from "../../../collection/immutable/Conc.js";
import type { Exit } from "../../../data/Exit.js";
import type { Fiber } from "../definition.js";

import { IO } from "../../IO.js";

/**
 * Awaits on all fibers to be completed, successfully or not.
 *
 * @tsplus static fncts.control.FiberOps awaitAll
 */
export function awaitAll<E, A>(as: Iterable<Fiber<E, A>>): IO<unknown, never, Exit<E, Conc<A>>> {
  return IO.foreachC(as, (f) => f.await.chain(IO.fromExitNow)).result;
}
