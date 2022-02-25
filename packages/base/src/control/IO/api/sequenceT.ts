import type { NonEmptyArray } from "../../../collection/immutable/NonEmptyArray";
import type { _A, _E, _R } from "../../../types";

import { identity, unsafeCoerce } from "../../../data/function";
import { IO } from "../definition";

/**
 * @tsplus static fncts.control.IOOps sequenceT
 */
export function sequenceT<T extends NonEmptyArray<IO<any, any, any>>>(
  ...ios: T
): IO<_R<T[number]>, _E<T[number]>, { [K in keyof T]: _A<T[K]> }> {
  return unsafeCoerce(IO.foreach(ios, identity));
}
