import type { Managed } from "../definition.js";
import type { Erase } from "@fncts/typelevel/Intersection";

import { Layer } from "../../Layer.js";

export function provideSomeLayer_<R, E, A, RIn, E1, ROut>(
  self: Managed<R, E, A>,
  layer: Layer<RIn, E1, ROut>,
): Managed<RIn & Erase<R, ROut>, E | E1, A> {
  // @ts-expect-error
  return self.provideLayer(Layer.environment<RIn>().and(layer));
}
