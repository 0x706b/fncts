import type { At } from "@fncts/base/optics/At";
import type { Iso } from "@fncts/base/optics/Iso";

import { Index } from "@fncts/base/optics/Index/definition";
import { Optional } from "@fncts/base/optics/Optional/definition";
import { Prism } from "@fncts/base/optics/Prism/definition";

/**
 * @tsplus static fncts.optics.IndexOps fromAt
 */
export function fromAt<T, J, B>(at: At<T, J, Maybe<B>>): Index<T, J, B> {
  return Index({ index: (i) => at.at(i).compose(Prism.just<B>()) });
}

/**
 * @tsplus static fncts.optics.IndexOps fromIso
 */
export function fromIso<T, S>(iso: Iso<T, S>) {
  return <I, A>(index: Index<S, I, A>): Index<T, I, A> => Index({ index: (i) => iso.compose(index.index(i)) });
}

/**
 * @tsplus static fncts.optics.IndexOps array
 */
export function array<A = never>(): Index<ReadonlyArray<A>, number, A> {
  return Index({
    index: (i) =>
      Optional({
        getOrModify: (s) => (i in s ? Either.right(s[i]!) : Either.left(s)),
        set: (a) => (s) => s.updateAt(i, a),
      }),
  });
}
