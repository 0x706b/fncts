import type { get } from "@fncts/base/optics/Getter";
import type { PLensPartiallyApplied } from "@fncts/base/optics/Lens";
import type { PPrismPartiallyApplied, reverseGet } from "@fncts/base/optics/Prism";

import { PLens } from "@fncts/base/optics/Lens";
import { PPrism } from "@fncts/base/optics/Prism";

/**
 * @tsplus type fncts.optics.PIso
 */
export interface PIso<S, T, A, B> extends PLens<S, T, A, B>, PPrism<S, T, A, B> {
  readonly reverse: () => PIso<B, A, T, S>;
}

export interface PIsoPartiallyApplied<T, A, B>
  extends PLensPartiallyApplied<T, A, B>,
    PPrismPartiallyApplied<T, A, B> {}

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
export function makePIso<S, T, A, B>(F: PIsoMin<S, T, A, B>): PIso<S, T, A, B> {
  return {
    ...PPrism({ getOrModify: F.get.compose(Either.right), reverseGet: F.reverseGet }),
    ...PLens({ get: F.get, set: (b) => () => F.reverseGet(b) }),
    reverse: () => PIso({ get: F.reverseGet, reverseGet: F.get }),
  };
}

/**
 * @tsplus type fncts.optics.Iso
 */
export interface Iso<S, A> extends PIso<S, S, A, A> {}

/**
 * @tsplus type fncts.optics.IsoOps
 */
export interface IsoOps {}

/**
 * @tsplus static fncts.optics.IsoOps __call
 */
export function makeIso<S, A>(F: PIsoMin<S, S, A, A>): Iso<S, A> {
  return PIso(F);
}
