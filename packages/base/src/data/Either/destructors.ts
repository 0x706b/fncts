import { EitherTag } from "./definition.js";

/**
 * @tsplus pipeable fncts.Either match
 */
export function match<E, A, B, C>(onLeft: (e: E) => B, onRight: (a: A) => C) {
  return (self: Either<E, A>): B | C => {
    self.concrete();
    switch (self._tag) {
      case EitherTag.Left:
        return onLeft(self.left);
      case EitherTag.Right:
        return onRight(self.right);
    }
  };
}
