import type { Identity } from "./definition.js";

/**
 * @tsplus fluent fncts.data.Identity ap
 */
export function ap_<A, B>(fab: Identity<(a: A) => B>, fa: Identity<A>): Identity<B> {
  return fab(fa);
}

/**
 * @tsplus fluent fncts.data.Identity map
 */
export function map_<A, B>(fa: Identity<A>, f: (a: A) => B): Identity<B> {
  return f(fa);
}

/**
 * @tsplus static fncts.data.IdentityOps pure
 * @tsplus static fncts.data.IdentityOps __call
 */
export function pure<A>(a: A): Identity<A> {
  return a;
}

/**
 * @tsplus fluent fncts.data.Identity zipWith
 */
export function zipWith_<A, B, C>(
  fa: Identity<A>,
  fb: Identity<B>,
  f: (a: A, b: B) => C,
): Identity<C> {
  return f(fa, fb);
}
