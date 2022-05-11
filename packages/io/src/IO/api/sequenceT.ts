import type { _A, _E, _R } from "@fncts/base/types";

import { identity, unsafeCoerce } from "@fncts/base/data/function";

/**
 * @tsplus static fncts.io.IOOps sequenceT
 */
export function sequenceT<T extends ReadonlyNonEmptyArray<IO<any, any, any>>>(
  ...ios: T
): IO<HKT._R<T[number]>, HKT._E<T[number]>, { [K in keyof T]: HKT._A<T[K]> }> {
  return unsafeCoerce(IO.foreach(ios, identity));
}
