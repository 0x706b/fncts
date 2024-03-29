import { Lens } from "@fncts/base/optics/Lens";
/**
 * @tsplus type fncts.optics.At
 */
export interface At<S, I, A> {
  readonly at: (i: I) => Lens<S, A>;
}

export type AtMin<S, I, A> =
  | {
      readonly get: (i: I) => (s: S) => A;
      readonly set: (i: I) => (a: A) => (s: S) => S;
    }
  | At<S, I, A>;

/**
 * @tsplus type fncts.optics.AtOps
 */
export interface AtOps {}

export const At: AtOps = {};

/**
 * @tsplus static fncts.optics.AtOps __call
 */
export function mkAt<S, I, A>(F: AtMin<S, I, A>): At<S, I, A> {
  if ("at" in F) {
    return F;
  } else {
    return {
      at: (i) => Lens({ get: F.get(i), set: F.set(i) }),
    };
  }
}
