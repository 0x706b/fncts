import type { IO } from "../definition.js";
import type { Erase } from "@fncts/typelevel/Intersection";

import { Layer } from "../../Layer.js";

/**
 * @tsplus fluent fncts.control.IO provideSomeLayer
 */
export function provideSomeLayer_<R, E, A, RIn, E1, ROut>(
  self: IO<R, E, A>,
  layer: Layer<RIn, E1, ROut>,
  __tsplusTrace?: string,
): IO<RIn & Erase<R, ROut>, E | E1, A> {
  // @ts-expect-error
  return self.provideLayer(Layer.environment<RIn>().and(layer));
}
