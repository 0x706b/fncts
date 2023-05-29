import { EitherTag } from "./definition.js";

/**
 * @tsplus pipeable fncts.Either match
 */
export function match<E, A, B, C>(cases: { Left: (e: E) => B; Right: (a: A) => C }) {
  return (self: Either<E, A>): B | C => {
    self.concrete();
    switch (self._tag) {
      case EitherTag.Left:
        return cases.Left(self.left);
      case EitherTag.Right:
        return cases.Right(self.right);
    }
  };
}
