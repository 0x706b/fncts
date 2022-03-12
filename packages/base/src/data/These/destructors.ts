import type { These } from "./definition.js";

import { TheseTag } from "./definition.js";

/**
 * @tsplus fluent fncts.data.These match
 */
export function match_<E, A, B, C, D>(
  self: These<E, A>,
  left: (e: E) => B,
  right: (a: A) => C,
  both: (e: E, a: A) => D,
): B | C | D {
  switch (self._tag) {
    case TheseTag.Left:
      return left(self.left);
    case TheseTag.Right:
      return right(self.right);
    case TheseTag.Both:
      return both(self.left, self.right);
  }
}
