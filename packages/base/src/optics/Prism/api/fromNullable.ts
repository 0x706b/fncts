import { Either } from "../../../data.js";
import { identity } from "../../../data/function.js";
import { Prism } from "../definition.js";

/**
 * @tsplus static fncts.optics.PPrismOps fromNullable
 */
export function fromNullable<A>(): Prism<A, NonNullable<A>> {
  return Prism({
    getOrModify: (a) => Either.fromNullable(a, a),
    reverseGet: identity,
  });
}
