import type { These } from "../../These";
import type { Either } from "../definition";

import { identity } from "../../function";

export function align_<E1, A, E2, B>(
  self: Either<E1, A>,
  fb: Either<E2, B>
): Either<E1 | E2, These<A, B>> {
  return self.alignWith(fb, identity);
}

// codegen:start { preset: pipeable }
/**
 * @tsplus dataFirst align_
 */
export function align<E2, B>(fb: Either<E2, B>) {
  return <E1, A>(self: Either<E1, A>): Either<E1 | E2, These<A, B>> =>
    align_(self, fb);
}
// codegen:end
