import type { Check } from "@fncts/typelevel/Check";

import { CompoundError, EmptyError } from "@fncts/base/data/DecodeError";

/**
 * @tsplus derive fncts.Guard[fncts.ImmutableNonEmptyArray]<_> 10
 */
export function deriveGuard<A extends ImmutableNonEmptyArray<any>>(
  ...[elem]: [A] extends [ImmutableNonEmptyArray<infer _A>] ? [elem: Guard<_A>] : never
): Guard<A> {
  return Guard((u): u is A => {
    if (ImmutableNonEmptyArray.is(u)) {
      return u.every(elem.is);
    }
    return false;
  });
}

/**
 * @tsplus derive fncts.Decoder[fncts.ImmutableNonEmptyArray]<_> 10
 */
export function deriveDecoder<A extends ImmutableNonEmptyArray<any>>(
  ...[array, elem]: [A] extends [ImmutableNonEmptyArray<infer _A>]
    ? Check<Check.IsEqual<A, ImmutableNonEmptyArray<_A>>> extends Check.True
      ? [array: Decoder<Array<_A>>, elem: Decoder<_A>]
      : never
    : never
): Decoder<A> {
  return Decoder(
    (u) =>
      array.decode(u).match2(These.left, (warn, as) => {
        if (as.isNonEmpty()) {
          return These.right(new ImmutableNonEmptyArray(as) as A);
        } else {
          const err = new EmptyError(as);
          return warn.match(
            () => These.left(err),
            (err0) => These.left(new CompoundError(`ImmutableNonEmptyArray<${elem.label}>`, Vector(err0, err))),
          );
        }
      }),
    `ImmutableNonEmptyArray<${elem.label}>`,
  );
}
