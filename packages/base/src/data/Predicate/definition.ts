export interface Predicate<A> {
  (a: A): boolean;
}

export interface PredicateWithIndex<I, A> {
  (i: I, a: A): boolean;
}
