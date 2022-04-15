/**
 * @tsplus fluent fncts.Identity ap
 */
export function ap_<A, B>(fab: Identity<(a: A) => B>, fa: Identity<A>): Identity<B> {
  return fab(fa);
}

/**
 * @tsplus fluent fncts.Identity map
 */
export function map_<A, B>(fa: Identity<A>, f: (a: A) => B): Identity<B> {
  return f(fa);
}

/**
 * @tsplus static fncts.IdentityOps pure
 * @tsplus static fncts.IdentityOps __call
 */
export function pure<A>(a: A): Identity<A> {
  return a;
}

/**
 * @tsplus fluent fncts.Identity zipWith
 */
export function zipWith_<A, B, C>(fa: Identity<A>, fb: Identity<B>, f: (a: A, b: B) => C): Identity<C> {
  return f(fa, fb);
}
