/**
 * @tsplus fluent global if
 */
export function matchPredicate<A, B extends A, C, D>(
  self: A,
  predicate: Refinement<A, B>,
  onFalse: (a: A) => C,
  onTrue: (a: B) => D,
): C | D;
export function matchPredicate<A, B, C>(
  self: A,
  predicate: Predicate<A>,
  onFalse: (a: A) => B,
  onTrue: (a: A) => C,
): B | C;
export function matchPredicate<A, B, C>(
  self: A,
  predicate: Predicate<A>,
  onFalse: (a: A) => B,
  onTrue: (a: A) => C,
): B | C {
  return predicate(self) ? onTrue(self) : onFalse(self);
}
