import type { URIO } from "@fncts/base/control/IO";
import type { Has } from "@fncts/base/prelude";

import { Sized } from "./definition.js";

/**
 * @tsplus static fncts.test.control.SizedOps size
 */
export const size: URIO<Has<Sized>, number> = IO.serviceWithIO(Sized.Tag)((sized) => sized.size);

/**
 * @tsplus static fncts.test.control.SizedOps withSize
 */
export function withSize(size: number) {
  return <R, E, A>(io: IO<R, E, A>): IO<R & Has<Sized>, E, A> =>
    IO.serviceWithIO(Sized.Tag)((sized) => sized.withSize(size)(io));
}
