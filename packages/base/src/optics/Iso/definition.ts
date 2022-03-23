import type { get } from "../Getter.js";
import type { reverseGet } from "../Prism.js";

import { Either } from "../../data/Either.js";
import { PLens } from "../Lens.js";
import { PPrism } from "../Prism.js";

/**
 * @tsplus type fncts.optics.PIso
 */
export interface PIso<S, T, A, B> extends PLens<S, T, A, B>, PPrism<S, T, A, B> {
  readonly reverse: () => PIso<B, A, T, S>;
}

/**
 * @tsplus type fncts.optics.PIsoOps
 */
export interface PIsoOps {}

export const PIso: PIsoOps = {};

export interface PIsoMin<S, T, A, B> {
  readonly get: get<S, A>;
  readonly reverseGet: reverseGet<T, B>;
}

/**
 * @tsplus static fncts.optics.PIsoOps __call
 */
export function mkPIso<S, T, A, B>(F: PIsoMin<S, T, A, B>): PIso<S, T, A, B> {
  return {
    ...PPrism({ getOrModify: F.get.compose(Either.right), reverseGet: F.reverseGet }),
    ...PLens({ get: F.get, set_: (_s, b) => F.reverseGet(b) }),
    reverse: () => PIso({ get: F.reverseGet, reverseGet: F.get }),
  };
}
