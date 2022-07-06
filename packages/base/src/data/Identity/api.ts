/**
 * @tsplus fluent fncts.Identity ap
 */
export function ap_<A, B>(fab: Identity<(a: A) => B>, fa: Identity<A>): Identity<B> {
  return Identity.get(Identity.reverseGet(fab)(Identity.reverseGet(fa)));
}

/**
 * @tsplus fluent fncts.Identity map
 */
export function map_<A, B>(fa: Identity<A>, f: (a: A) => B): Identity<B> {
  return Identity.get(f(Identity.reverseGet(fa)));
}

/**
 * @tsplus static fncts.IdentityOps pure
 * @tsplus static fncts.IdentityOps __call
 */
export function pure<A>(a: A): Identity<A> {
  return Identity.get(a);
}

/**
 * @tsplus fluent fncts.Identity zipWith
 */
export function zipWith_<A, B, C>(fa: Identity<A>, fb: Identity<B>, f: (a: A, b: B) => C): Identity<C> {
  return Identity.get(f(Identity.reverseGet(fa), Identity.reverseGet(fb)));
}

/**
 * @tsplus fluent fncts.Identity zip
 */
export function zip_<A, B>(fa: Identity<A>, fb: Identity<B>): Identity<readonly [A, B]> {
  return fa.zipWith(fb, (a, b) => [a, b]);
}

/**
 * @tsplus getter fncts.Identity getIdentity
 * @tsplus macro identity
 */
export function getIdentity<A>(self: Identity<A>): A {
  return Identity.reverseGet(self);
}
