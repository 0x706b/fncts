import type { Brand } from "../Branded.js";
import type { Check } from "@fncts/typelevel";
import type { OptionalKeys, RequiredKeys } from "@fncts/typelevel/Object";

import { Encoder } from "./definition.js";

/**
 * @tsplus static fncts.EncoderOps __call
 */
export function makeEncoder<A>(encode: (inp: A) => unknown): Encoder<A> {
  return new Encoder(encode);
}

/**
 * @tsplus implicit
 */
export const boolean: Encoder<boolean> = Encoder(Function.identity);

/**
 * @tsplus implicit
 */
export const number: Encoder<number> = Encoder(Function.identity);

/**
 * @tsplus implicit
 */
export const string: Encoder<number> = Encoder(Function.identity);

/**
 * @tsplus implicit
 */
export const _null: Encoder<null> = Encoder(Function.identity);

/**
 * @tsplus implicit
 */
export const date: Encoder<Date> = Encoder((d) => d.toISOString());

/**
 * @tsplus derive fncts.Encoder<_> 10
 */
export function deriveValidation<A extends Brand.Valid<any, any>>(
  ...[base]: Check<Brand.IsValidated<A>> extends Check.True ? [base: Encoder<Brand.Unbranded<A>>] : never
): Encoder<A> {
  return Encoder((a) => base.encode(a as Brand.Unbranded<A>));
}

/**
 * @tsplus derive fncts.Encoder lazy
 */
export function deriveLazy<A>(fn: (_: Encoder<A>) => Encoder<A>): Encoder<A> {
  let cached: Encoder<A> | undefined;
  const encoder: Encoder<A> = Encoder((a) => {
    if (!cached) {
      cached = fn(encoder);
    }
    return cached.encode(a);
  });
  return encoder;
}

/**
 * @tsplus derive fncts.Encoder<_> 20
 */
export function deriveStruct<A extends Record<string, any>>(
  ...[requiredFields, optionalFields]: Check<Check.IsStruct<A>> extends Check.True
    ? [
        ...[
          requiredFields: {
            [K in RequiredKeys<A>]: Encoder<A[K]>;
          },
        ],
        ...([OptionalKeys<A>] extends [never]
          ? []
          : [
              optionalFields: {
                [K in OptionalKeys<A>]: Encoder<NonNullable<A[K]>>;
              },
            ]),
      ]
    : never
): Encoder<A> {
  return Encoder((inp) => {
    const encoded = {};
    for (const field of Object.keys(requiredFields)) {
      encoded[field] = (requiredFields[field] as Encoder<unknown>).encode(inp[field]);
    }
    if (optionalFields) {
      for (const field of Object.keys(optionalFields)) {
        if (field in inp && typeof inp[field] !== undefined) {
          encoded[field] = (optionalFields[field] as Encoder<unknown>).encode(inp[field]);
        }
      }
    }
    return encoded;
  });
}

/**
 * @tsplus derive fncts.Encoder<|> 30
 */
export function deriveUnion<A extends Array<unknown>>(
  ...elements: {
    [K in keyof A]: [Guard<A[K]>, Encoder<A[K]>];
  }
): Encoder<A[number]> {
  return Encoder((inp) => {
    for (const [guard, encoder] of elements) {
      if (guard.is(inp)) {
        return encoder.encode(inp);
      }
    }
  });
}

/**
 * @tsplus derive fncts.Encoder<_> 10
 */
export function deriveEmptyRecord<A extends {}>(
  ..._: Check<Check.IsEqual<A, {}>> extends Check.True ? [] : never
): Encoder<A> {
  return Encoder(Function.identity);
}
