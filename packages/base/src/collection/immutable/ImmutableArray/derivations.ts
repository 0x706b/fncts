import type { Check } from "@fncts/typelevel/Check";

/**
 * @tsplus derive fncts.Guard[fncts.ImmutableArray]<_> 10
 */
export function deriveGuard<A extends ImmutableArray<any>>(
  ...[element]: [A] extends [ImmutableArray<infer A>] ? [element: Guard<A>] : never
): Guard<A> {
  return Guard((u): u is A => {
    if (ImmutableArray.is(u)) {
      return u._array.every(element.is);
    }
    return false;
  });
}

/**
 * @tsplus derive fncts.Decoder[fncts.ImmutableArray]<_> 10
 */
export function deriveDecoder<A extends ImmutableArray<any>>(
  ...[array, elem]: [A] extends [ImmutableArray<infer _A>]
    ? Check<Check.IsEqual<A, ImmutableArray<_A>>> extends Check.True
      ? [array: Decoder<Array<_A>>, elem: Decoder<_A>]
      : never
    : never
): Decoder<A> {
  return Decoder((u) => array.decode(u).map((as) => new ImmutableArray(as) as A), `ImmutableArray<${elem.label}>`);
}
