import type { Spreadable } from "../../../types.js";
import type { Erase } from "@fncts/typelevel/Intersection";

/**
 * @tsplus fluent fncts.control.IO provideSomeLayer
 */
export function provideSomeLayer_<R, E, A, RIn extends Spreadable, E1, ROut extends Spreadable>(
  self: IO<R, E, A>,
  layer: Layer<RIn, E1, ROut>,
  __tsplusTrace?: string,
): IO<RIn & Erase<R, ROut>, E | E1, A> {
  return self.provideLayer(Layer.environment<RIn>().and(layer));
}

/**
 * @tsplus static fncts.control.IOAspects provideSomeLayer
 */
export function provideSomeLayer<RIn extends Spreadable, E1, ROut extends Spreadable>(
  layer: Layer<RIn, E1, ROut>,
  __tsplusTrace?: string,
) {
  return <R, E, A>(self: IO<R & ROut, E, A>): IO<R & RIn, E | E1, A> => self.provideLayer(layer);
}
