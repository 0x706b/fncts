import type { Layer } from "../../Layer.js";
import type { IO } from "../definition.js";

import { Scope } from "../../Scope.js";

/**
 * @tsplus fluent fncts.control.IO provideLayer
 */
export function provideLayer_<RIn, E, ROut, E1, A>(
  self: IO<ROut, E1, A>,
  layer: Layer<RIn, E, ROut>,
): IO<RIn, E | E1, A> {
  return Scope.make.bracketExit(
    (scope) => layer.build(scope).chain((r) => self.provideEnvironment(r)),
    (scope, exit) => scope.close(exit),
  );
}
