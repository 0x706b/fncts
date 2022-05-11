import type { Either } from "../definition.js";

import { These } from "../../These.js";
import { EitherTag, Right } from "../definition.js";

/**
 * @tsplus fluent fncts.Either alignWith
 */
export function alignWith_<E1, A, E2, B, C>(
  self: Either<E1, A>,
  fb: Either<E2, B>,
  f: (_: These<A, B>) => C,
): Either<E1 | E2, C> {
  self.concrete();
  fb.concrete();
  return self._tag === EitherTag.Left
    ? fb._tag === EitherTag.Left
      ? self
      : Right(f(These.right(fb.right)))
    : fb._tag === EitherTag.Left
    ? Right(f(These.left(self.right)))
    : Right(f(These.both(self.right, fb.right)));
}
