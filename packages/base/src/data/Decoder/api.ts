import type { DecodeError } from "@fncts/base/data/DecodeError";
import type { Check } from "@fncts/typelevel/Check";
import type { OptionalKeys, RequiredKeys } from "@fncts/typelevel/Object";

import {
  CompoundError,
  LiteralError,
  MemberError,
  MissingKeyError,
  OptionalKeyError,
  PrimitiveError,
  RequiredKeyError,
  UnionError,
} from "@fncts/base/data/DecodeError";
import { Decoder } from "@fncts/base/data/Decoder/definition";

/**
 * @tsplus fluent fncts.Decoder __call
 */
export function decode<I, E, A>(self: Decoder<A>, input: unknown): These<DecodeError, A> {
  return self.decode(input);
}

export function fromGuard<A>(guard: Guard<A>, onFalse: (i: unknown) => DecodeError, label: string): Decoder<A> {
  return Decoder((a) => (guard.is(a) ? These.right(a) : These.left(onFalse(a))), label);
}

/**
 * @tsplus implicit
 */
export const string: Decoder<string> = fromGuard(String.Guard, (u) => new PrimitiveError(u, "string"), "string");

/**
 * @tsplus implicit
 */
export const number: Decoder<number> = fromGuard(Number.Guard, (u) => new PrimitiveError(u, "number"), "number");

/**
 * @tsplus implicit
 */
export const boolean: Decoder<boolean> = fromGuard(Boolean.Guard, (u) => new PrimitiveError(u, "boolean"), "boolean");

/**
 * @tsplus static fncts.DecoderOps record
 * @tsplus implicit
 */
export const record: Decoder<{}> = fromGuard(Object.Guard, (u) => new PrimitiveError(u, "{}"), "{}");

/**
 * @tsplus derive fncts.Decoder lazy
 */
export function deriveLazy<A>(f: (_: Decoder<A>) => Decoder<A>): Decoder<A> {
  let cached: Decoder<A> | undefined;
  const decoder: Decoder<A> = Decoder((u) => {
    if (!cached) {
      cached = f(decoder);
    }
    return cached.decode(u);
  }, "[Recursive]");
  return decoder;
}

/**
 * @tsplus derive fncts.Decoder<_> 20
 */
export function deriveLiteral<A extends string | number | boolean>(
  ...[value]: Check<Check.IsLiteral<A> & Check.Not<Check.IsUnion<A>>> extends Check.True ? [value: A] : never
): Decoder<A> {
  return Decoder(
    (u) => (u === value ? These.right(u as A) : These.left(new LiteralError(u, Vector(value)))),
    value.toString(),
  );
}

/**
 * @tsplus derive fncts.Decoder<|> 30
 */
export function deriveUnion<A extends ReadonlyArray<unknown>>(
  ...elements: {
    [K in keyof A]: Decoder<A[K]>;
  }
): Decoder<A[number]> {
  const label = elements.map((decoder) => decoder.label).join(" | ");
  return Decoder((u) => {
    const errors: Array<MemberError> = [];
    for (const decoder of elements) {
      const result = decoder.decode(u);
      if (result.isLeft()) {
        errors.push(new MemberError(decoder.label, result.left));
      } else {
        return These.rightOrBoth(result.leftMaybe, result.right);
      }
    }
    return These.left(new UnionError(label, Vector.from(errors)));
  }, label);
}

/**
 * @tsplus derive fncts.Decoder<_> 20
 */
export function deriveStruct<A extends Record<string, any>>(
  ...[requiredFields, optionalFields]: Check<Check.IsStruct<A>> extends Check.True
    ? [
        ...[
          requiredFields: {
            [k in RequiredKeys<A>]: Decoder<A[k]>;
          },
        ],
        ...([OptionalKeys<A>] extends [never]
          ? []
          : [
              optionalFields: {
                [k in OptionalKeys<A>]: Decoder<NonNullable<A[k]>>;
              },
            ]),
      ]
    : never
): Decoder<A> {
  let label = "{";
  let first = true;
  for (const k in requiredFields) {
    if (first) {
      label += ` ${k}: ${(requiredFields[k] as Decoder<any>).label}`;
    } else {
      label += `, ${k}: ${(requiredFields[k] as Decoder<any>).label}`;
    }
    first = false;
  }
  if (optionalFields) {
    for (const k in optionalFields) {
      if (first) {
        label += ` ${k}?: ${(optionalFields[k] as Decoder<any>).label}`;
      } else {
        label += `, ${k}?: ${(optionalFields[k] as Decoder<any>).label}`;
      }
    }
  }
  if (label.length > 1) {
    label += " ";
  }
  label += "}";

  return Decoder((u) => {
    const recordResult = record.decode(u);
    if (recordResult.isLeft()) {
      return recordResult;
    }
    const input = recordResult.right;
    let errored = false;
    const errors: Array<RequiredKeyError | OptionalKeyError> = [];
    const decoded = {} as A;
    for (const key in requiredFields) {
      if (!(key in input)) {
        errors.push(new RequiredKeyError(key, new MissingKeyError(key)));
        errored = true;
      } else {
        const res = (requiredFields[key] as Decoder<any>).decode(input[key]);
        res.match2(
          (e) => {
            errored = true;
            errors.push(new RequiredKeyError(key, e));
          },
          (warning, a) => {
            decoded[key as keyof A] = a;
            if (warning.isJust()) {
              errors.push(new RequiredKeyError(key, warning.value));
            }
          },
        );
      }
    }
    if (optionalFields) {
      for (const key in optionalFields) {
        if (key in input && typeof input[key as string] !== "undefined") {
          const res = (optionalFields[key] as Decoder<any>).decode(input[key as string]);
          res.match2(
            (e) => {
              errored = true;
              errors.push(new OptionalKeyError(key, e));
            },
            (warning, a) => {
              decoded[key as keyof A] = a;
              if (warning.isJust()) {
                errors.push(new RequiredKeyError(key, warning.value));
              }
            },
          );
        }
      }
    }
    if (errored) {
      return These.left(new CompoundError("struct", Vector.from(errors)));
    }
    if (errors.length !== 0) {
      return These.both(new CompoundError("struct", Vector.from(errors)), decoded);
    }
    return These.right(decoded);
  }, label);
}
