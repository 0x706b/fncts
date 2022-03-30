import type { Has } from "../../../prelude.js";

import { Scope } from "../../Scope.js";
import { Finalizer } from "../../Scope/Finalizer.js";
import { IO } from "../definition.js";

/**
 * @tsplus getter fncts.control.IO concurrentFinalizers
 */
export function concurrentFinalizers<R, E, A>(io: IO<R, E, A>): IO<R & Has<Scope>, E, A> {
  return IO.gen(function* (_) {
    const outerScope = yield* _(IO.scope);
    const innerScope = yield* _(Scope.concurrent);
    yield* _(outerScope.addFinalizerExit(Finalizer.get((exit) => innerScope.close(exit))));
    return yield* _(innerScope.extend(io));
  });
}