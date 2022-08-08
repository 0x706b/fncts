import type { Check } from "@fncts/typelevel/Check";

/**
 * @tsplus derive fncts.Guard[fncts.Conc]<_> 10
 */
export function deriveGuard<A extends Conc<any>>(
  ...[elem]: [A] extends [Conc<infer _A>] ? [elem: Guard<_A>] : never
): Guard<A> {
  return Guard((u): u is A => {
    if (Conc.is(u)) {
      return u.every(elem.is);
    }
    return false;
  });
}

/**
 * @tsplus derive fncts.Decoder[fncts.Conc]<_> 10
 */
export function deriveDecoder<A extends Conc<any>>(
  ...[array, elem]: [A] extends [Conc<infer _A>]
    ? Check<Check.IsEqual<A, Conc<_A>>> extends Check.True
      ? [array: Decoder<Array<_A>>, elem: Decoder<_A>]
      : never
    : never
): Decoder<A> {
  return Decoder((u) => array.decode(u).map((a) => Conc.from(a) as A), `Conc<${elem.label}>`);
}
