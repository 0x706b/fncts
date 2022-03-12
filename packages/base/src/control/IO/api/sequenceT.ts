import type { ReadonlyNonEmptyArray } from "../../../collection/immutable/NonEmptyArray.js";
import type { _A, _E, _R } from "../../../types.js";

import { identity, unsafeCoerce } from "../../../data/function.js";
import { IO } from "../definition.js";

/**
 * @tsplus static fncts.control.IOOps sequenceT
 */
export function sequenceT<T extends ReadonlyNonEmptyArray<IO<any, any, any>>>(
  ...ios: T
): IO<_R<T[number]>, _E<T[number]>, { [K in keyof T]: _A<T[K]> }> {
  return unsafeCoerce(IO.foreach(ios, identity));
}
