/**
 * @tsplus pipeable fncts.Refinement and
 * @tsplus pipeable-operator fncts.Refinement &&
 */
export function and<A, B extends A, C extends B>(that: Refinement<B, C>): (self: Refinement<A, B>) => Refinement<A, C>;
export function and<A, B extends A>(that: Predicate<B>): (self: Refinement<A, B>) => Refinement<A, B>;
export function and<A, B extends A>(that: Predicate<B>) {
  return (self: Refinement<A, B>): Refinement<A, B> => {
    return (a): a is B => self(a) && that(a);
  };
}

/**
 * @tsplus pipeable fncts.Refinement contramap
 */
export function contramap<A extends C, C>(f: (c: C) => A) {
  return <B extends A>(self: Refinement<A, B>): Refinement<C, B> => {
    return (c): c is B => self(f(c));
  };
}

/**
 * @tsplus pipeable fncts.Refinement or
 * @tsplus pipeable-operator fncts.Refinement ||
 */
export function or<A, C extends A>(that: Refinement<A, C>) {
  return <B extends A>(self: Refinement<A, B>): Refinement<A, B | C> => {
    return (a): a is B | C => self(a) || that(a);
  };
}

/**
 * @tsplus fluent fncts.Refinement invert
 */
export function invert<A, B extends A>(self: Refinement<A, B>): Refinement<A, Exclude<A, B>> {
  return (a): a is Exclude<A, B> => !self(a);
}
