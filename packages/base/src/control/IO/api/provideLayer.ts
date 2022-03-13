import type { Layer } from "../../Layer.js";
import type { IO } from "../definition.js";

/**
 * @tsplus fluent fncts.control.IO provideLayer
 */
export function provideLayer_<RIn, E, ROut, E1, A>(
  self: IO<ROut, E1, A>,
  layer: Layer<RIn, E, ROut>,
): IO<RIn, E | E1, A> {
  return layer.build.use((r) => self.provideEnvironment(r));
}
