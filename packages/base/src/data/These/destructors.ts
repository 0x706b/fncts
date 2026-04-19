import { TheseTag } from "./definition.js";

/**
 * Unsafely extracts the right value, if present.
 *
 * @tsplus getter fncts.These right
 */
export function unsafeGetRight<E, A>(self: These<E, A>): A | undefined {
  return self.isRight() || self.isBoth() ? self.right : undefined;
}

/**
 * Unsafely extracts the left value, if present.
 *
 * @tsplus getter fncts.These left
 */
export function unsafeGetLeft<E, A>(self: These<E, A>): E | undefined {
  return self.isLeft() ? self.left : undefined;
}

/**
 * Extracts the right value as a `Maybe`.
 *
 * @tsplus getter fncts.These rightMaybe
 */
export function rightMaybe<E, A>(self: These<E, A>): Maybe<A> {
  return self.isRight() || self.isBoth() ? Just(self.right) : Nothing();
}

/**
 * Extracts the left value as a `Maybe`.
 *
 * @tsplus getter fncts.These leftMaybe
 */
export function leftMaybe<E, A>(self: These<E, A>): Maybe<E> {
  return self.isLeft() ? Just(self.left) : Nothing();
}

/**
 * Pattern matches on `Left`, `Right`, and `Both`.
 *
 * @tsplus pipeable fncts.These match
 */
export function match<E, A, B, C, D>(left: (e: E) => B, right: (a: A) => C, both: (e: E, a: A) => D) {
  return (self: These<E, A>): B | C | D => {
    switch (self._tag) {
      case TheseTag.Left:
        return left(self.left);
      case TheseTag.Right:
        return right(self.right);
      case TheseTag.Both:
        return both(self.left, self.right);
    }
  };
}

/**
 * Pattern matches on `Left` or value-bearing states with optional left.
 *
 * @tsplus pipeable fncts.These match2
 */
export function match2<E, A, B, C>(left: (e: E) => B, right: (e: Maybe<E>, a: A) => C) {
  return (self: These<E, A>): B | C => {
    switch (self._tag) {
      case TheseTag.Left:
        return left(self.left);
      case TheseTag.Right:
      case TheseTag.Both:
        return right(self.leftMaybe, self.right);
    }
  };
}
