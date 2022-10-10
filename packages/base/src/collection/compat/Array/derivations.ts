import type { DecodeError } from "@fncts/base/data/DecodeError";
import type { Check } from "@fncts/typelevel/Check";

import { CompoundError, OptionalIndexError, PrimitiveError } from "@fncts/base/data/DecodeError";

/**
 * @tsplus derive fncts.Guard[fncts.Array]<_> 10
 */
export function deriveGuard<A extends Array<any>>(
  ...[element]: [A] extends [Array<infer _A>]
    ? Check<Check.IsEqual<A, Array<_A>>> extends Check.True
      ? [element: Guard<_A>]
      : never
    : never
): Guard<A> {
  return Guard((u): u is A => {
    if (Array.isArray(u)) {
      return u.every(element.is);
    }
    return false;
  });
}

/**
 * @tsplus derive fncts.Guard[fncts.ReadonlyArray]<_> 10
 */
export const deriveReadonlyArrayGuard: <A extends ReadonlyArray<any>>(
  ...[element]: [A] extends [ReadonlyArray<infer _A>]
    ? Check<Check.IsEqual<A, ReadonlyArray<_A>>> extends Check.True
      ? [element: Guard<_A>]
      : never
    : never
) => Guard<A> = unsafeCoerce(deriveGuard);

/**
 * @tsplus derive fncts.Decoder[fncts.Array]<_> 10
 */
export function deriveDecoder<A extends Array<any>>(
  ...[element]: [A] extends [Array<infer _A>]
    ? Check<Check.IsEqual<A, Array<_A>>> extends Check.True
      ? [element: Decoder<_A>]
      : never
    : never
): Decoder<A> {
  return Decoder((u) => {
    if (Array.isArray(u)) {
      const errors = Vector.emptyPushable<DecodeError>();
      let failed   = false;
      const out    = Array(u.length);
      for (let i = 0; i < u.length; i++) {
        const decoded = element.decode(u[i]!);
        decoded.match2(
          (err) => {
            failed = true;
            errors.push(new OptionalIndexError(i, err));
          },
          (warning, value) => {
            out[i] = value;
            if (warning.isJust()) {
              errors.push(warning.value);
            }
          },
        );
      }
      if (failed) {
        return These.left(new CompoundError("Array", errors));
      }
      return These.rightOrBoth(errors.length > 0 ? Just(new CompoundError("Array", errors)) : Nothing(), out as A);
    }
    return These.left(new PrimitiveError(u, "Array"));
  }, `Array<${element.label}>`);
}

/**
 * @tsplus derive fncts.Decoder[fncts.ReadonlyArray]<_> 10
 */
export function deriveReadonlyArrayDecoder<A extends ReadonlyArray<any>>(
  ...[element]: [A] extends [ReadonlyArray<infer _A>]
    ? Check<Check.IsEqual<A, ReadonlyArray<_A>>> extends Check.True
      ? [element: Decoder<_A>]
      : never
    : never
): Decoder<A> {
  return Decoder((u) => deriveDecoder(element).decode(u) as These<DecodeError, A>, `ReadonlyArray<${element.label}>`);
}

/**
 * @tsplus derive fncts.Encoder[fncts.Array]<_> 10
 */
export function deriveEncoder<A extends Array<any>>(
  ...[element]: [A] extends [Array<infer _A>]
    ? Check<Check.IsEqual<A, Array<_A>>> extends Check.True
      ? [element: Encoder<_A>]
      : never
    : never
): Encoder<A> {
  return Encoder((inp) => inp.map((a) => element.encode(a)));
}

/**
 * @tsplus derive fncts.Encoder[fncts.ReadonlyArray]<_> 10
 */
export function deriveReadonlyArrayEncoder<A extends ReadonlyArray<any>>(
  ...[element]: [A] extends [ReadonlyArray<infer _A>]
    ? Check<Check.IsEqual<A, ReadonlyArray<_A>>> extends Check.True
      ? [element: Encoder<_A>]
      : never
    : never
): Encoder<A> {
  return Encoder((inp) => inp.map((a) => element.encode(a)));
}
