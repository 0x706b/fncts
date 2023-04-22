import type { Brand, Validation } from "../Branded.js";
import type { Check } from "@fncts/typelevel";
import type { Literal } from "@fncts/typelevel/Any";
import type { OptionalKeys, RequiredKeys } from "@fncts/typelevel/Object";

import { Encoder } from "./definition.js";

/**
 * @tsplus static fncts.EncoderOps __call
 */
export function makeEncoder<A>(encode: (inp: A) => unknown): Encoder<A> {
  return new Encoder(encode);
}

/**
 * @tsplus static fncts.EncoderOps unknown
 */
export const unknown: Encoder<unknown> = Encoder(Function.identity);

/**
 * @tsplus implicit
 * @tsplus static fncts.EncoderOps boolean
 */
export const boolean: Encoder<boolean> = Encoder(Function.identity);

/**
 * @tsplus implicit
 * @tsplus static fncts.EncoderOps number
 */
export const number: Encoder<number> = Encoder(Function.identity);

/**
 * @tsplus implicit
 * @tsplus static fncts.EncoderOps string
 */
export const string: Encoder<string> = Encoder(Function.identity);

/**
 * @tsplus implicit
 * @tsplus static fncts.EncoderOps bigint
 */
export const bigint: Encoder<bigint> = Encoder((n) => n.toString(10));

/**
 * @tsplus implicit
 * @tsplus static fncts.EncoderOps null
 */
export const _null: Encoder<null> = Encoder(Function.identity);

/**
 * @tsplus implicit
 * @tsplus static fncts.EncoderOps undefined
 */
export const _undefined: Encoder<undefined> = Encoder(Function.identity);

/**
 * @tsplus implicit
 * @tsplus static fncts.EncoderOps date
 */
export const date: Encoder<Date> = Encoder((d) => d.toISOString());

/**
 * @tsplus derive fncts.Encoder lazy
 * @tsplus static fncts.EncoderOps lazy
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

export function deriveLiteral<A extends string | number | boolean>(
  ...[value]: Check<Check.IsLiteral<A> & Check.Not<Check.IsUnion<A>>> extends Check.True ? [value: A] : never
): Encoder<A> {
  return Encoder(Function.identity);
}

/**
 * @tsplus static fncts.EncoderOps literal
 */
export function literal<A extends Literal>(value: A): Encoder<A> {
  return Encoder(Function.identity);
}

/**
 * @tsplus static fncts.EncoderOps nullable
 */
export function nullable<A>(/** @tsplus implicit local */ base: Encoder<A>): Encoder<A | null | undefined> {
  return Encoder((inp) => (inp == null ? inp : base.encode(inp)));
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
 * @tsplus static fncts.EncoderOps struct
 */
export function struct<A extends Record<string, any>>(fields: {
  [K in keyof A]: Encoder<A[K]>;
}): Encoder<A> {
  return Encoder((inp) => {
    const encoded = {};
    for (const field of Object.keys(fields)) {
      encoded[field] = fields[field]!.encode(inp[field]);
    }
    return encoded;
  });
}

/**
 * @tsplus static fncts.EncoderOps partial
 */
export function partial<A extends Record<string, any>>(fields: {
  [K in keyof A]: Encoder<A[K]>;
}): Encoder<Partial<A>> {
  return Encoder((inp) => {
    const encoded = {};
    for (const field of Object.keys(fields)) {
      if (field in inp && typeof inp[field] !== undefined) {
        encoded[field] = fields[field]!.encode(inp[field]!);
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

/**
 * @tsplus derive fncts.Encoder[fncts.Array]<_> 10
 */
export function deriveArray<A extends Array<any>>(
  ...[element]: [A] extends [Array<infer _A>]
    ? Check<Check.IsEqual<A, Array<_A>>> extends Check.True
      ? [element: Encoder<_A>]
      : never
    : never
): Encoder<A> {
  return Encoder((inp) => inp.map((a) => element.encode(a)));
}

/**
 * @tsplus static fncts.EncoderOps array
 */
export function array<A>(/** @tsplus implicit local */ base: Encoder<A>): Encoder<Array<A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Encoder[fncts.ReadonlyArray]<_> 10
 */
export function deriveReadonlyArray<A extends ReadonlyArray<any>>(
  ...[element]: [A] extends [ReadonlyArray<infer _A>]
    ? Check<Check.IsEqual<A, ReadonlyArray<_A>>> extends Check.True
      ? [element: Encoder<_A>]
      : never
    : never
): Encoder<A> {
  return Encoder((inp) => inp.map((a) => element.encode(a)));
}

/**
 * @tsplus static fncts.EncoderOps readonlyArray
 */
export function readonlyArray<A>(/** @tsplus implicit local */ base: Encoder<A>): Encoder<ReadonlyArray<A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Encoder<_> 15
 */
export function deriveDictionary<A extends Record<string, any>>(
  ...[value]: Check<Check.IsDictionary<A>> extends Check.True ? [value: Encoder<A[keyof A]>] : never
): Encoder<A> {
  return Encoder((inp) => {
    const encoded = {};
    for (const k of Object.keys(inp)) {
      encoded[k] = value.encode(inp[k]);
    }
    return encoded;
  });
}

/**
 * @tsplus derive fncts.Encoder<_> 15
 */
export function deriveRecord<A extends Record<string, any>>(
  ...[value, requiredKeys]: Check<Check.IsRecord<A>> extends Check.True
    ? [
        value: Encoder<A[keyof A]>,
        requiredKeys: {
          [K in keyof A]: 0;
        },
      ]
    : never
): Encoder<A> {
  return Encoder((inp) => {
    const encoded = {};
    for (const k of Object.keys(requiredKeys)) {
      encoded[k] = value.encode(inp[k]);
    }
    return encoded;
  });
}

/**
 * @tsplus static fncts.EncoderOps record
 */
export function record<A>(codomain: Encoder<A>): Encoder<Record<string, A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Encoder[fncts.ImmutableArray]<_> 10
 */
export function deriveImmutableArray<A extends ImmutableArray<any>>(
  ...[element]: [A] extends [ImmutableArray<infer _A>]
    ? Check<Check.IsEqual<A, ImmutableArray<_A>>> extends Check.True
      ? [element: Encoder<_A>]
      : never
    : never
): Encoder<A> {
  return Encoder((inp) => inp._array.map((a) => element.encode(a)));
}

/**
 * @tsplus static fncts.EncoderOps immutableArray
 */
export function immutableArray<A>(base: Encoder<A>): Encoder<ImmutableArray<A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Encoder[fncts.ImmutableNonEmptyArray]<_> 10
 */
export function deriveImmutableNonEmptyArray<A extends ImmutableNonEmptyArray<any>>(
  ...[element]: [A] extends [ImmutableNonEmptyArray<infer _A>]
    ? Check<Check.IsEqual<A, ImmutableNonEmptyArray<_A>>> extends Check.True
      ? [element: Encoder<_A>]
      : never
    : never
): Encoder<A> {
  return Encoder((inp) => inp._array.map((a) => element.encode(a)));
}

/**
 * @tsplus static fncts.EncoderOps immutableNonEmptyArray
 */
export function immutableNonEmptyArray<A>(base: Encoder<A>): Encoder<ImmutableNonEmptyArray<A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Encoder[fncts.Conc]<_> 10
 */
export function deriveConc<A extends Conc<any>>(
  ...[element]: [A] extends [Conc<infer _A>]
    ? Check<Check.IsEqual<A, Conc<_A>>> extends Check.True
      ? [element: Encoder<_A>]
      : never
    : never
): Encoder<A> {
  return Encoder((inp) => Array.from(inp).map((a) => element.encode(a)));
}

/**
 * @tsplus static fncts.EncoderOps conc
 */
export function conc<A>(base: Encoder<A>): Encoder<Conc<A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Encoder<_> 10
 */
export function deriveValidation<A extends Brand.Valid<any, any>>(
  ...[base]: Check<Brand.IsValidated<A>> extends Check.True ? [base: Encoder<Brand.Unbranded<A>>] : never
): Encoder<A> {
  return Encoder((inp) => base.encode(inp.unsafeCoerce()));
}

/**
 * @tsplus static fncts.EncoderOps validation
 */
export function validation<A, B extends ReadonlyArray<Validation<A, any>>>(..._validations: B) {
  return (
    base: Encoder<A>,
  ): Encoder<A & { [K in keyof B]: B[K] extends Validation<any, infer S> ? Brand.Valid<A, S> : never }[number]> =>
    Encoder(base.encode.unsafeCoerce());
}

/**
 * @tsplus derive fncts.Encoder<_> 10
 */
export function deriveTuple<A extends ReadonlyArray<unknown>>(
  ...[components]: Check<Check.IsTuple<A>> extends Check.True ? [components: { [K in keyof A]: Encoder<A[K]> }] : never
): Encoder<A> {
  return Encoder((inp) => {
    const out = Array(inp.length);
    for (let i = 0; i < inp.length; i++) {
      out[i] = components[i]!.encode(inp[i]);
    }
    return out;
  });
}

/**
 * @tsplus static fncts.EncoderOps tuple
 */
export function tuple<A extends ReadonlyArray<unknown>>(...components: { [K in keyof A]: Encoder<A[K]> }): Encoder<A> {
  return deriveTuple(components as [never]).unsafeCoerce()
}
