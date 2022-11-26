import type { IOVariance } from "@fncts/io/IO/definition";

import { identity, unsafeCoerce } from "@fncts/base/data/function";

/**
 * @tsplus static fncts.io.IOOps sequenceT
 */
export function sequenceT<T extends ReadonlyNonEmptyArray<IO<any, any, any>>>(
  ...ios: T
): IO<
  [T[number]] extends [{ [IOVariance]: { _R: () => infer R } }] ? R : never,
  [T[number]] extends [{ [IOVariance]: { _E: () => infer E } }] ? E : never,
  { [K in keyof T]: T[K] extends { [IOVariance]: { _A: () => infer A } } ? A : never }
> {
  return unsafeCoerce(IO.foreach(ios, identity));
}
