import type { Iso } from "@fncts/base/optics/Iso";

import { At } from "@fncts/base/optics/At/definition";

/**
 * Lifts an `At` through an `Iso` by composing each indexed lens with the isomorphism.
 *
 * @tsplus static fncts.optics.AtOps fromIso
 */
export function fromIso<T, S>(iso: Iso<T, S>) {
  return <I, A>(at: At<S, I, A>): At<T, I, A> => At({ at: (i) => iso.compose(at.at(i)) });
}
