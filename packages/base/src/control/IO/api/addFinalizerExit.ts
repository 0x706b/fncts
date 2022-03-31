import type { Exit } from "../../../data/Exit.js";
import type { Has } from "../../../prelude.js";
import type { Scope } from "../../Scope.js";
import type { URIO } from "../definition.js";

import { Finalizer } from "../../Scope/Finalizer.js";
import { IO } from "../definition.js";

/**
 * @tsplus static fncts.control.IOOps addFinalizerExit
 */
export function addFinalizerExit<R>(finalizer: (exit: Exit<any, any>) => URIO<R, any>): IO<R & Has<Scope>, never, void> {
  return IO.gen(function* (_) {
    const environment = yield* _(IO.environment<R>());
    const scope       = yield* _(IO.scope);
    yield* _(scope.addFinalizerExit(Finalizer.get((exit) => finalizer(exit).provideEnvironment(environment))));
  });
}