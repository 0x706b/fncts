import type { get, GetterPartiallyApplied } from "@fncts/base/optics/Getter";
import type { POptionalPartiallyApplied } from "@fncts/base/optics/Optional";
import type { set } from "@fncts/base/optics/Setter";

import { Getter } from "@fncts/base/optics/Getter";
import { POptional } from "@fncts/base/optics/Optional";

/**
 * @tsplus type fncts.optics.PLens
 */
export interface PLens<S, T, A, B> extends POptional<S, T, A, B>, Getter<S, A> {}

export interface PLensPartiallyApplied<T, A, B> extends POptionalPartiallyApplied<T, A, B>, GetterPartiallyApplied<A> {}

/**
 * @tsplus type fncts.optics.PLensOps
 */
export interface PLensOps {}

export const PLens: PLensOps = {};

export interface PLensMin<S, T, A, B> {
  readonly get: get<S, A>;
  readonly set: set<S, T, B>;
}

/**
 * @tsplus static fncts.optics.PLensOps __call
 */
export function makePLens<S, T, A, B>(F: PLensMin<S, T, A, B>): PLens<S, T, A, B> {
  return {
    ...POptional({ set: F.set, getOrModify: (s) => Either.right(F.get(s)) }),
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
export function makeLens<S, A>(F: PLensMin<S, S, A, A>): Lens<S, A> {
  return PLens(F);
}
