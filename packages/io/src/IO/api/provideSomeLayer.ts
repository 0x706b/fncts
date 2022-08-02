import type { Spreadable } from "@fncts/base/types";
import type { Erase } from "@fncts/typelevel/Intersection";

/**
 * @tsplus fluent fncts.io.IO provideSomeLayer
 */
export function provideSomeLayer_<R, E, A, RIn, E1, ROut>(
  self: IO<R, E, A>,
  layer: Layer<RIn, E1, ROut>,
  __tsplusTrace?: string,
): IO<RIn & Erase<R, ROut>, E | E1, A> {
  // @ts-expect-error
  return self.provideLayer(Layer.environment<RIn>().and(layer));
}

/**
 * @tsplus static fncts.io.IOAspects provideSomeLayer
 */
export function provideSomeLayer<RIn, E1, ROut>(layer: Layer<RIn, E1, ROut>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R | ROut, E, A>): IO<R | RIn, E | E1, A> =>
    self.provideSomeLayer(layer);
}
