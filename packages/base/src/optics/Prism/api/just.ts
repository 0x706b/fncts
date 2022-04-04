import { Prism } from "@fncts/base/optics/Prism/definition";

/**
 * @tsplus static fncts.optics.PPrismOps just
 */
export function just<A>(): Prism<Maybe<A>, A> {
  return Prism({
    getOrModify: (s) => s.match(() => Either.left(Nothing()), Either.right),
    reverseGet: Maybe.just,
  });
}
