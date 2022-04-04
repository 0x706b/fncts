import { identity } from "@fncts/base/data/function";
import { Prism } from "@fncts/base/optics/Prism/definition";

/**
 * @tsplus static fncts.optics.PPrismOps fromNullable
 */
export function fromNullable<A>(): Prism<A, NonNullable<A>> {
  return Prism({
    getOrModify: (a) => Either.fromNullable(a, a),
    reverseGet: identity,
  });
}
