import type { Spreadable } from "@fncts/base/types";
import type { Erase } from "@fncts/typelevel/Intersection";
/**
 * @tsplus static fncts.io.IOAspects provideSomeLayer
 * @tsplus pipeable fncts.io.IO provideSomeLayer
 */
export function provideSomeLayer<RIn, E1, ROut>(layer: Layer<RIn, E1, ROut>, __tsplusTrace?: string) {
  return <R, E, A>(self: IO<R, E, A>): IO<RIn & Erase<R, ROut>, E | E1, A> => {
    // @ts-expect-error
    return self.provideLayer(Layer.environment<RIn>().and(layer));
  };
}
