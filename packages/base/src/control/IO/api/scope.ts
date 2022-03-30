import type { Has } from "../../../prelude.js";

import { Scope } from "../../Scope.js";
import { IO } from "../definition.js";

/**
 * @tsplus static fncts.control.IOOps scope
 */
export const scope: IO<Has<Scope>, never, Scope> = IO.service(Scope.Tag);