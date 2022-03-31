import { Either } from "../../../data/Either.js";
import { Maybe, Nothing } from "../../../data/Maybe.js";
import { Prism } from "../definition.js";

/**
 * @tsplus static fncts.optics.PPrismOps just
 */
export function just<A>(): Prism<Maybe<A>, A> {
  return Prism({
    getOrModify: (s) => s.match(() => Either.left(Nothing()), Either.right),
    reverseGet: Maybe.just,
  });
}
