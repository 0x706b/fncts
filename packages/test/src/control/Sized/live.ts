import type { IO } from "@fncts/base/control/IO";
import type { Has } from "@fncts/base/prelude";

import { FiberRef } from "@fncts/base/control/FiberRef";

import { Sized } from "./definition.js";

/**
 * @tsplus static fncts.test.control.SizedOps live
 */
export function live(size: number): Layer<unknown, never, Has<Sized>> {
  return Layer.fromIO(Sized.Tag)(
    FiberRef.make(size).map(
      (ref) =>
        new (class extends Sized {
          size = ref.get;
          withSize(size: number) {
            return <R, E, A>(io: IO<R, E, A>): IO<R, E, A> => ref.locally(size)(io);
          }
        })(),
    ),
  );
}
