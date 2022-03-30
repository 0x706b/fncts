import type { Lazy } from "../../../data/function.js";
import type { Has } from "../../../prelude.js";

import { Scope } from "../../Scope.js";
import { IO } from "../definition.js";

/**
 * @tsplus static fncts.control.IOOps scoped
 */
export function scoped<R, E, A>(io: Lazy<IO<R & Has<Scope>, E, A>>): IO<R, E, A> {
  return Scope.make.chain((scope) => scope.use(io));
}

/**
 * @tsplus getter fncts.control.IO scoped
 */
export function scoped_<R, E, A>(io: IO<R & Has<Scope>, E, A>): IO<R, E, A> {
  return IO.scoped(io);
}