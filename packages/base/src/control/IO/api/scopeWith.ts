import type { Has } from "../../../prelude.js";

import { Scope } from "../../Scope.js";
import { IO } from "../definition.js";

/**
 * @tsplus static fncts.control.IOOps scopeWith
 */
export function scopeWith<R, E, A>(f: (scope: Scope) => IO<R, E, A>): IO<R & Has<Scope>, E, A> {
  return IO.serviceWithIO(Scope.Tag)(f);
}