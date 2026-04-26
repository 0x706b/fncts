import type { Iso } from "@fncts/base/optics/Iso";

import { Index } from "@fncts/base/optics/Index/definition";
import { Optional } from "@fncts/base/optics/Optional/definition";

/**
 * Builds an `Index` by lifting it through an `Iso`.
 *
 * @tsplus static fncts.optics.IndexOps fromIso
 */
export function fromIso<T, S>(iso: Iso<T, S>) {
  return <I, A>(index: Index<S, I, A>): Index<T, I, A> => Index({ index: (i) => iso.compose(index.index(i)) });
}

/**
 * Creates an `Index` that focuses an array element by numeric position.
 *
 * @tsplus static fncts.optics.IndexOps array
 */
export function array<A = never>(): Index<ReadonlyArray<A>, number, A> {
  return Index({
    index: (i) =>
      Optional({
        getOrModify: (s) => (i in s ? Either.right(s[i]!) : Either.left(s)),
        set: (a) => (s) => s.unsafeUpdateAt(i, a),
      }),
  });
}
