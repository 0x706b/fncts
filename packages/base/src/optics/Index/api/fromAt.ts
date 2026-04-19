import type { At } from "@fncts/base/optics/At";

import { Index } from "@fncts/base/optics/Index/definition";
import { Prism } from "@fncts/base/optics/Prism/definition";

/**
 * Builds an `Index` from an `At` by focusing only present values.
 *
 * @tsplus static fncts.optics.IndexOps fromAt
 */
export function fromAt<T, J, B>(at: At<T, J, Maybe<B>>): Index<T, J, B> {
  return Index({ index: (i) => at.at(i).compose(Prism.just<B>()) });
}
