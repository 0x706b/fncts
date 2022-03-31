import type { Maybe } from "../../data.js";
import type { At } from "../At.js";
import type { Iso } from "../Iso.js";

import { Prism } from "../Prism.js";
import { Index } from "./definition.js";

/**
 * @tsplus static fncts.optics.IndexOps fromAt
 */
export function fromAt<T, J, B>(at: At<T, J, Maybe<B>>): Index<T, J, B> {
  return Index({ index: (i) => at.at(i).compose(Prism.just<B>()) });
}

/**
 * @tsplus static fncts.optics.IndexOps fromIso
 */
export function fromIso<T, S>(iso: Iso<T, S>) {
  return <I, A>(index: Index<S, I, A>): Index<T, I, A> =>
    Index({ index: (i) => iso.compose(index.index(i)) });
}
