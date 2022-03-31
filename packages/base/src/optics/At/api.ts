import type { Iso } from "../Iso.js";

import { At } from "./definition.js";

/**
 * @tsplus static fncts.optics.AtOps fromIso
 */
export function fromIso<T, S>(iso: Iso<T, S>) {
  return <I, A>(at: At<S, I, A>): At<T, I, A> => At({ at: (i) => iso.compose(at.at(i)) });
}
