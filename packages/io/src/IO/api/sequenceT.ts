import type { _A, _E, _R } from "@fncts/base/types";

import { identity, unsafeCoerce } from "@fncts/base/data/function";

/**
 * @tsplus static fncts.io.IOOps sequenceT
 */
export function sequenceT<T extends ReadonlyNonEmptyArray<IO<any, any, any>>>(
  ...ios: T
): IO<_R<T[number]>, _E<T[number]>, { [K in keyof T]: _A<T[K]> }> {
  return unsafeCoerce(IO.foreach(ios, identity));
}
