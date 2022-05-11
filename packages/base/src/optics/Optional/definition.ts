import type { set_ } from "@fncts/base/optics/Setter";

import { PTraversal } from "@fncts/base/optics/Traversal";

/**
 * @tsplus type fncts.optics.POptional
 */
export interface POptional<S, T, A, B> extends PTraversal<S, T, A, B> {
  readonly getMaybe: getMaybe<S, A>;
  readonly getOrModify: getOrModify<S, T, A>;
  readonly modifyMaybe_: modifyMaybe_<S, T, A, B>;
  readonly modifyMaybe: modifyMaybe<S, T, A, B>;
}

export interface POptionalMin<S, T, A, B> {
  readonly getOrModify: getOrModify<S, T, A>;
  readonly replace_: set_<S, T, B>;
}

/**
 * @tsplus type fncts.optics.POptionalOps
 */
export interface POptionalOps {}

export const POptional: POptionalOps = {};

/**
 * @tsplus static fncts.optics.POptionalOps __call
 */
export function mkPOptional<S, T, A, B>(F: POptionalMin<S, T, A, B>): POptional<S, T, A, B> {
  const getMaybe: getMaybe<S, A>               = (s) => F.getOrModify(s).getRight;
  const modifyMaybe_: modifyMaybe_<S, T, A, B> = (s, f) => getMaybe(s).map((a) => F.replace_(s, f(a)));

  return {
    getOrModify: F.getOrModify,
    getMaybe,
    modifyMaybe_,
    modifyMaybe: (f) => (s) => modifyMaybe_(s, f),
    ...PTraversal<S, T, A, B>({
      modifyA: (s, f, A) =>
        F.getOrModify(s).match(
          (t) => A.pure(t),
          (a) => f(a).map((b) => F.replace_(s, b), A),
        ),
    }),
  };
}

/**
 * @tsplus type fncts.optics.Optional
 */
export interface Optional<S, A> extends POptional<S, S, A, A> {}

/**
 * @tsplus type fncts.optics.OptionalOps
 */
export interface OptionalOps extends POptionalOps {}

export const Optional: OptionalOps = {};

/**
 * @tsplus static fncts.optics.OptionalOps __call
 */
export function mkOptional<S, A>(F: POptionalMin<S, S, A, A>): Optional<S, A> {
  return POptional(F);
}

export interface getMaybe<S, A> {
  (s: S): Maybe<A>;
}

export interface getOrModify<S, T, A> {
  (s: S): Either<T, A>;
}

export interface modifyMaybe_<S, T, A, B> {
  (s: S, f: (a: A) => B): Maybe<T>;
}

export interface modifyMaybe<S, T, A, B> {
  (f: (a: A) => B): (s: S) => Maybe<T>;
}

export interface replaceMaybe_<S, T, B> {
  (s: S, b: B): Maybe<T>;
}

export interface replaceMaybe<S, T, B> {
  (b: B): (s: S) => Maybe<T>;
}
