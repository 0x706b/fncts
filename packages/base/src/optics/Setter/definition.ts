/**
 * @tsplus type fncts.optics.PSetter
 */
export interface PSetter<S, T, A, B> {
  readonly modify: modify<S, T, A, B>;
  readonly set: set<S, T, B>;
}

export interface PSetterPartiallyApplied<T, A, B> {
  readonly modify: modifyPartiallyApplied<T, A, B>;
  readonly set: setPartiallyApplied<T, B>;
}

/**
 * @tsplus type fncts.optics.PSetterOps
 */
export interface PSetterOps {}

export const PSetter: PSetterOps = {};

/**
 * @tsplus static fncts.optics.PSetterOps __call
 */
export function makePSetter<S, T, A, B>(F: PSetter<S, T, A, B>): PSetter<S, T, A, B> {
  return F;
}

/**
 * @tsplus type fncts.optics.Setter
 */
export interface Setter<S, A> extends PSetter<S, S, A, A> {}

/**
 * @tsplus type fncts.optics.SetterOps
 */
export interface SetterOps extends PSetterOps {}

/**
 * @tsplus static fncts.optics.SetterOps __call
 */
export function makeSetter<S, A>(F: PSetter<S, S, A, A>): Setter<S, A> {
  return PSetter(F);
}

export interface modify<S, T, A, B> {
  (f: (a: A) => B): (s: S) => T;
}

export interface set<S, T, B> {
  (b: B): (s: S) => T;
}

export interface modifyPartiallyApplied<T, A, B> {
  (f: (a: A) => B): T;
}

export interface setPartiallyApplied<T, B> {
  (b: B): T;
}
