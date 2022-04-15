import type { These } from "../../These.js";
import type { Either } from "../definition.js";

import { identity } from "../../function.js";

export function align_<E1, A, E2, B>(self: Either<E1, A>, fb: Either<E2, B>): Either<E1 | E2, These<A, B>> {
  return self.alignWith(fb, identity);
}
