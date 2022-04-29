/**
 * @tsplus fluent fncts.Refinement and
 * @tsplus operator fncts.Refinement &&
 */
export function and<A, B extends A, C extends B>(self: Refinement<A, B>, that: Refinement<B, C>): Refinement<A, C> {
  return (a): a is C => self(a) && that(a);
}

/**
 * @tsplus fluent fncts.Refinement contramap
 */
export function contramap<A extends C, B extends A, C>(self: Refinement<A, B>, f: (c: C) => A): Refinement<C, B> {
  return (c): c is B => self(f(c));
}

/**
 * @tsplus fluent fncts.Refinement or
 * @tsplus operator fncts.Refinement ||
 */
export function or<A, B extends A, C extends A>(self: Refinement<A, B>, that: Refinement<A, C>): Refinement<A, B | C> {
  return (a): a is B | C => self(a) || that(a);
}

/**
 * @tsplus fluent fncts.Refinement invert
 */
export function invert<A, B extends A>(self: Refinement<A, B>): Refinement<A, Exclude<A, B>> {
  return (a): a is Exclude<A, B> => !self(a);
}
