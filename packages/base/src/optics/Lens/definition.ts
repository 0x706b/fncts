import type { get } from "@fncts/base/optics/Getter";
import type { set_ } from "@fncts/base/optics/Setter";

import { Getter } from "@fncts/base/optics/Getter";
import { POptional } from "@fncts/base/optics/Optional";

/**
 * @tsplus type fncts.optics.PLens
 */
export interface PLens<S, T, A, B> extends POptional<S, T, A, B>, Getter<S, A> {}

/**
 * @tsplus type fncts.optics.PLensOps
 */
export interface PLensOps {}

export const PLens: PLensOps = {};

export interface PLensMin<S, T, A, B> {
  readonly get: get<S, A>;
  readonly set_: set_<S, T, B>;
}

/**
 * @tsplus static fncts.optics.PLensOps __call
 */
export function mkPLens<S, T, A, B>(F: PLensMin<S, T, A, B>): PLens<S, T, A, B> {
  return {
    ...POptional({ replace_: F.set_, getOrModify: (s) => Either.right(F.get(s)) }),
    ...Getter({ get: F.get }),
  };
}

/**
 * @tsplus type fncts.optics.Lens
 */
export interface Lens<S, A> extends PLens<S, S, A, A> {}

/**
 * @tsplus type fncts.optics.LensOps
 */
export interface LensOps extends PLensOps {}

export const Lens: LensOps = {};

/**
 * @tsplus static fncts.optics.LensOps __call
 */
export function mkLens<S, A>(F: PLensMin<S, S, A, A>): Lens<S, A> {
  return PLens(F);
}
