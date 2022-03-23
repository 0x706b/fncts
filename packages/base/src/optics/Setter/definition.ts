/**
 * @tsplus type fncts.optics.PSetter
 */
export interface PSetter<S, T, A, B> {
  readonly modify_: modify_<S, T, A, B>;
  readonly modify: modify<S, T, A, B>;
  readonly set_: set_<S, T, B>;
  readonly set: set<S, T, B>;
}

export interface PSetterMin<S, T, A, B> {
  readonly modify_: modify_<S, T, A, B>;
  readonly set_: set_<S, T, B>;
}

/**
 * @tsplus type fncts.optics.PSetterOps
 */
export interface PSetterOps {}

export const PSetter: PSetterOps = {};

/**
 * @tsplus static fncts.optics.PSetterOps __call
 */
export function mkPSetter<S, T, A, B>(F: PSetterMin<S, T, A, B>): PSetter<S, T, A, B> {
  return {
    modify_: F.modify_,
    modify: (f) => (s) => F.modify_(s, f),
    set_: F.set_,
    set: (b) => (s) => F.set_(s, b),
  };
}

export interface modify_<S, T, A, B> {
  (s: S, f: (a: A) => B): T;
}

export interface modify<S, T, A, B> {
  (f: (a: A) => B): (s: S) => T;
}

export interface set_<S, T, B> {
  (s: S, b: B): T;
}

export interface set<S, T, B> {
  (b: B): (s: S) => T;
}
