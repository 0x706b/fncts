/**
 * @tsplus pipeable global if
 */
export function matchPredicate<A, B extends A, C, D>(
  predicate: Refinement<A, B>,
  onFalse: (a: A) => C,
  onTrue: (a: B) => D,
): (self: A) => C | D;
export function matchPredicate<A, B, C>(
  predicate: Predicate<A>,
  onFalse: (a: A) => B,
  onTrue: (a: A) => C,
): (self: A) => B | C;
export function matchPredicate<A, B, C>(predicate: Predicate<A>, onFalse: (a: A) => B, onTrue: (a: A) => C) {
  return (self: A): B | C => {
    return predicate(self) ? onTrue(self) : onFalse(self);
  };
}
