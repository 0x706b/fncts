/**
 * @tsplus pipeable fncts.Identity ap
 */
export function ap<A>(fa: Identity<A>) {
  return <B>(fab: Identity<(a: A) => B>): Identity<B> => {
    return Identity.get(Identity.reverseGet(fab)(Identity.reverseGet(fa)));
  };
}

/**
 * @tsplus pipeable fncts.Identity map
 */
export function map<A, B>(f: (a: A) => B) {
  return (fa: Identity<A>): Identity<B> => {
    return Identity.get(f(Identity.reverseGet(fa)));
  };
}

/**
 * @tsplus static fncts.IdentityOps pure
 * @tsplus static fncts.IdentityOps __call
 */
export function pure<A>(a: A): Identity<A> {
  return Identity.get(a);
}

/**
 * @tsplus pipeable fncts.Identity zipWith
 */
export function zipWith<A, B, C>(fb: Identity<B>, f: (a: A, b: B) => C) {
  return (fa: Identity<A>): Identity<C> => {
    return Identity.get(f(Identity.reverseGet(fa), Identity.reverseGet(fb)));
  };
}

/**
 * @tsplus pipeable fncts.Identity zip
 */
export function zip<B>(fb: Identity<B>) {
  return <A>(fa: Identity<A>): Identity<Zipped.Make<A, B>> => {
    return fa.zipWith(fb, (a, b) => Zipped(a, b));
  };
}

/**
 * @tsplus getter fncts.Identity getIdentity
 * @tsplus macro identity
 */
export function getIdentity<A>(self: Identity<A>): A {
  return Identity.reverseGet(self);
}
