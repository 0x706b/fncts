import type { Either } from "./definition";

import { EitherTag } from "./definition";

/**
 * @tsplus fluent fncts.data.Either match
 */
export function match_<E, A, B, C>(self: Either<E, A>, left: (e: E) => B, right: (a: A) => C): B | C {
  switch (self._tag) {
    case EitherTag.Left:
      return left(self.left);
    case EitherTag.Right:
      return right(self.right);
  }
}
