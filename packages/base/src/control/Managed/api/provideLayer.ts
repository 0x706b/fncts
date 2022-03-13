import type { Layer } from "../../Layer.js";

import { Managed } from "../definition.js";

/**
 * @tsplus fluent fncts.control.Managed provideLayer
 */
export function provideLayer_<RIn, E, ROut, E1, A>(
  self: Managed<ROut, E1, A>,
  layer: Layer<RIn, E, ROut>,
  __tsplusTrace?: string,
): Managed<RIn, E | E1, A> {
  return Managed.defer(layer.build.chain((r) => self.provideEnvironment(r)));
}
