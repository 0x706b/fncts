import type { These } from "../../These.js";
import type { Either } from "../definition.js";

import { identity } from "../../function.js";

/**
 * @tsplus pipeable fncts.Either align
 */
export function align<E2, B>(fb: Either<E2, B>) {
  return <E1, A>(self: Either<E1, A>): Either<E1 | E2, These<A, B>> => {
    return self.alignWith(fb, identity);
  };
}
