import { EitherTag } from "./definition.js";

/**
 * @tsplus pipeable fncts.Either match
 */
export function match<E, A, B, C>(left: (e: E) => B, right: (a: A) => C) {
  return (self: Either<E, A>): B | C => {
    self.concrete();
    switch (self._tag) {
      case EitherTag.Left:
        return left(self.left);
      case EitherTag.Right:
        return right(self.right);
    }
  };
}
