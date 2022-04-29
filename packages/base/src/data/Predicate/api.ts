/**
 * @tsplus operator fncts.Predicate &&
 */
export function and<A>(self: Predicate<A>, that: Predicate<A>): Predicate<A> {
  return (a) => self(a) && that(a);
}

/**
 * @tsplus fluent fncts.Predicate contramap
 */
export function contramap<A, B>(self: Predicate<A>, f: (b: B) => A): Predicate<B> {
  return (b) => self(f(b));
}

/**
 * @tsplus getter fncts.Predicate invert
 */
export function invert<A>(self: Predicate<A>): Predicate<A> {
  return (a) => !self(a);
}

/**
 * @tsplus operator fncts.Predicate ||
 */
export function or<A extends B, B>(self: Predicate<A>, that: Predicate<B>): Predicate<A> {
  return (a) => self(a) || that(a);
}
