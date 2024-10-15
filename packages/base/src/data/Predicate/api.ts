/**
 * @tsplus pipeable fncts.Predicate and
 * @tsplus pipeable-operator fncts.Predicate &&
 */
export function and<A>(that: Predicate<A>) {
  return (self: Predicate<A>): Predicate<A> =>
    (a) =>
      self(a) && that(a);
}

/**
 * @tsplus pipeable fncts.Predicate contramap
 */
export function contramap<A, B>(f: (b: B) => A) {
  return (self: Predicate<A>): Predicate<B> => {
    return (b) => self(f(b));
  };
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
export function or<A extends B, B>(that: Predicate<B>) {
  return (self: Predicate<A>): Predicate<A> =>
    (a) =>
      self(a) || that(a);
}
