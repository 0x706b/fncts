import type { Brand, Validation } from "@fncts/base/data/Branded";
import type { DecodeError } from "@fncts/base/data/DecodeError";
import type { Literal } from "@fncts/typelevel/Any";
import type { Check } from "@fncts/typelevel/Check";
import type { OptionalKeys, RequiredKeys } from "@fncts/typelevel/Object";

import { BrandedError } from "@fncts/base/data/DecodeError";
import { EmptyError } from "@fncts/base/data/DecodeError";
import { OptionalIndexError } from "@fncts/base/data/DecodeError";
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
import { pipe } from "@fncts/base/data/function";
import { isNull, isUndefined } from "@fncts/base/util/predicates";

/**
 * @tsplus pipeable fncts.Decoder __call
 */
export function decode(input: unknown) {
  return <A>(self: Decoder<A>): These<DecodeError, A> => {
    return self.decode(input);
  };
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
 * @tsplus implicit
 */
export const bigint: Decoder<bigint> = fromGuard(BigInt.Guard, (u) => new PrimitiveError(u, "bigint"), "bigint");

/**
 * @tsplus static fncts.DecoderOps object
 * @tsplus implicit
 */
export const object: Decoder<object> = fromGuard(Object.Guard, (u) => new PrimitiveError(u, "{}"), "{}");

/**
 * @tsplus static fncts.DecoderOps unknown
 */
export const unknown: Decoder<unknown> = Decoder(These.right, "unknown");

/**
 * @tsplus static fncts.DecoderOps null
 * @tsplus implicit
 */
export const _null: Decoder<null> = fromGuard(Guard(isNull), (u) => new PrimitiveError(u, "null"), "null");

/**
 * @tsplus static fncts.DecoderOps undefined
 * @tsplus implicit
 */
export const _undefined: Decoder<undefined> = fromGuard(
  Guard(isUndefined),
  (u) => new PrimitiveError(u, "undefined"),
  "undefined",
);

/**
 * @tsplus static fncts.DecoderOps nullable
 */
export function nullable<A>(/** @tsplus implicit local */ base: Decoder<A>): Decoder<A | null | undefined> {
  return Derive();
}

/**
 * @tsplus derive fncts.Decoder lazy
 * @tsplus static fncts.DecoderOps lazy
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
 * @tsplus static fncts.DecoderOps literal
 */
export function literal<A extends Literal>(value: A): Decoder<A> {
  return Decoder(
    (u) => (u === value ? These.right(u as A) : These.left(new LiteralError(u, Vector(value)))),
    value.toString(),
  );
}

/**
 * @tsplus derive fncts.Decoder<_> 20
 */
export function deriveLiteral<A extends string | number | boolean>(
  ...[value]: Check<Check.IsLiteral<A> & Check.Not<Check.IsUnion<A>>> extends Check.True ? [value: A] : never
): Decoder<A> {
  return Decoder.literal(value);
}

/**
 * @tsplus static fncts.DecoderOps union
 * @tsplus derive fncts.Decoder<|> 30
 */
export function union<A extends ReadonlyArray<unknown>>(
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
 * @tsplus static fncts.DecoderOps struct
 */
export function struct<A extends Record<string, any>>(fields: {
  [K in keyof A]: Decoder<A[K]>;
}): Decoder<A> {
  let label = "{";
  let first = true;
  for (const k in fields) {
    if (first) {
      label += ` ${k}: ${(fields[k] as Decoder<any>).label}`;
    } else {
      label += `, ${k}: ${(fields[k] as Decoder<any>).label}`;
    }
    first = false;
  }
  if (label.length > 1) {
    label += " ";
  }
  label += "}";

  return Decoder((u) => {
    const recordResult = object.decode(u);
    if (recordResult.isLeft()) {
      return recordResult;
    }
    const input = recordResult.right;
    let errored = false;
    const errors: Array<RequiredKeyError | OptionalKeyError> = [];
    const decoded = {} as A;
    for (const key in fields) {
      if (!(key in input)) {
        errors.push(new RequiredKeyError(key, new MissingKeyError(key)));
        errored = true;
      } else {
        const res = (fields[key] as Decoder<any>).decode(input[key as string]);
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
    if (errored) {
      return These.left(new CompoundError("struct", Vector.from(errors)));
    }
    if (errors.length !== 0) {
      return These.both(new CompoundError("struct", Vector.from(errors)), decoded);
    }
    return These.right(decoded);
  }, label);
}

/**
 * @tsplus static fncts.DecoderOps partial
 */
export function partial<A extends Record<string, any>>(fields: {
  [K in keyof A]: Decoder<A[K]>;
}): Decoder<Partial<A>> {
  let label = "{";
  let first = true;
  for (const k in fields) {
    if (first) {
      label += ` ${k}?: ${(fields[k] as Decoder<any>).label}`;
    } else {
      label += `, ${k}?: ${(fields[k] as Decoder<any>).label}`;
    }
    first = false;
  }
  if (label.length > 1) {
    label += " ";
  }
  label += "}";

  return Decoder((u) => {
    const recordResult = object.decode(u);
    if (recordResult.isLeft()) {
      return recordResult;
    }
    const input = recordResult.right;
    let errored = false;
    const errors: Array<RequiredKeyError | OptionalKeyError> = [];
    const decoded = {} as A;
    for (const key in fields) {
      if (key in input && typeof input[key as string] !== "undefined") {
        const res = (fields[key] as Decoder<any>).decode(input[key as string]);
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
    if (errored) {
      return These.left(new CompoundError("struct", Vector.from(errors)));
    }
    if (errors.length !== 0) {
      return These.both(new CompoundError("struct", Vector.from(errors)), decoded);
    }
    return These.right(decoded);
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
    const recordResult = object.decode(u);
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

/**
 * @tsplus derive fncts.Decoder[fncts.Array]<_> 10
 */
export function deriveArray<A extends Array<any>>(
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
 * @tsplus static fncts.DecoderOps array
 */
export function array<A>(base: Decoder<A>): Decoder<Array<A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Decoder[fncts.ReadonlyArray]<_> 10
 */
export function deriveReadonlyArray<A extends ReadonlyArray<any>>(
  ...[element]: [A] extends [ReadonlyArray<infer _A>]
    ? Check<Check.IsEqual<A, ReadonlyArray<_A>>> extends Check.True
      ? [element: Decoder<_A>]
      : never
    : never
): Decoder<A> {
  return Decoder((u) => deriveArray(element).decode(u) as These<DecodeError, A>, `ReadonlyArray<${element.label}>`);
}

/**
 * @tsplus static fncts.DecoderOps readonlyArray
 */
export function readonlyArray<A>(base: Decoder<A>): Decoder<ReadonlyArray<A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Decoder<_> 15
 */
export function deriveRecord<A extends Record<string, any>>(
  ...[keyGuard, valueDecoder, requiredKeysRecord]: [A] extends [Record<infer X, infer Y>]
    ? Check<Check.Not<Check.IsUnion<A>> & Check.IsEqual<A, Record<X, Y>>> extends Check.True
      ? [
          keyGuard: Guard<X>,
          valueDecoder: Decoder<Y>,
          requiredKeysRecord: {
            [k in X]: 0;
          },
        ]
      : never
    : never
): Decoder<A> {
  return Decoder((u) => {
    const recordResult = Derive<Decoder<object>>().decode(u);
    if (recordResult.isLeft()) {
      return recordResult;
    }
    const asRecord = recordResult.right;
    const errors: Array<RequiredKeyError | OptionalKeyError> = [];
    let errored   = false;
    const missing = new Set(Object.keys(requiredKeysRecord));
    const res     = {};
    for (const k in asRecord) {
      if (keyGuard.is(k)) {
        const valueResult = valueDecoder.decode(asRecord[k]);
        valueResult.match2(
          (e) => {
            errored = true;
            errors.push(new (k in requiredKeysRecord ? RequiredKeyError : OptionalKeyError)(k, e));
          },
          (warning, a) => {
            missing.delete(k);
            res[k] = a;
            if (warning.isJust()) {
              errors.push(new (k in requiredKeysRecord ? RequiredKeyError : OptionalKeyError)(k, warning.value));
            }
          },
        );
      }
    }
    if (errored) {
      return These.left(new CompoundError("record", Vector.from(errors)));
    }
    if (errors.length > 0) {
      return These.both(new CompoundError("record", Vector.from(errors)), res as A);
    }
    if (missing.size > 0) {
      return These.left(
        new CompoundError(
          "record",
          Vector.from(missing).map((k) => new MissingKeyError(k)),
        ),
      );
    }
    return These.right(res as A);
  }, `Record<string, ${valueDecoder.label}>`);
}

/**
 * @tsplus static fncts.DecoderOps record
 */
export function record<A>(codomain: Decoder<A>): Decoder<Record<string, A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Decoder[fncts.ImmutableArray]<_> 10
 */
export function deriveImmutableArray<A extends ImmutableArray<any>>(
  ...[array, elem]: [A] extends [ImmutableArray<infer _A>]
    ? Check<Check.IsEqual<A, ImmutableArray<_A>>> extends Check.True
      ? [array: Decoder<Array<_A>>, elem: Decoder<_A>]
      : never
    : never
): Decoder<A> {
  return Decoder((u) => array.decode(u).map((as) => new ImmutableArray(as) as A), `ImmutableArray<${elem.label}>`);
}

/**
 * @tsplus static fncts.DecoderOps immutableArray
 */
export function immutableArray<A>(base: Decoder<A>): Decoder<ImmutableArray<A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Decoder[fncts.ImmutableNonEmptyArray]<_> 10
 */
export function deriveImmutableNonEmptyArray<A extends ImmutableNonEmptyArray<any>>(
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

/**
 * @tsplus static fncts.DecoderOps immutableNonEmptyArray
 */
export function immutableNonEmptyArray<A>(base: Decoder<A>): Decoder<ImmutableNonEmptyArray<A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Decoder[fncts.Conc]<_> 10
 */
export function deriveConc<A extends Conc<any>>(
  ...[array, elem]: [A] extends [Conc<infer _A>]
    ? Check<Check.IsEqual<A, Conc<_A>>> extends Check.True
      ? [array: Decoder<Array<_A>>, elem: Decoder<_A>]
      : never
    : never
): Decoder<A> {
  return Decoder((u) => array.decode(u).map((a) => Conc.from(a) as A), `Conc<${elem.label}>`);
}

/**
 * @tsplus static fncts.DecoderOps conc
 */
export function conc<A>(base: Decoder<A>): Decoder<Conc<A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Decoder<_> 10
 */
export function deriveValidation<A extends Brand.Valid<any, any>>(
  ...[base, brands]: Check<Brand.IsValidated<A>> extends Check.True
    ? [
        base: Decoder<Brand.Unbranded<A>>,
        brands: {
          [K in keyof A[Brand.valid] & string]: Validation<A[Brand.valid][K], K>;
        },
      ]
    : never
): Decoder<A> {
  const label = "Brand<" + Object.keys(brands).join(" & ") + ">";
  return Decoder(
    (u) =>
      base.decode(u).match2(These.left, (warning, value) => {
        const failedBrands: Array<string> = [];
        for (const brand in brands) {
          if (!brands[brand]!.validate(value as any)) {
            failedBrands.push(brand);
          }
        }
        if (failedBrands.length > 0) {
          const error = new BrandedError(label, Vector.from(failedBrands));
          return warning.match(
            () => These.left(error),
            (warning) => These.left(new CompoundError(label, Vector(warning, error))),
          );
        }
        return These.rightOrBoth(warning, value as A);
      }),
    label,
  );
}

/**
 * @tsplus static fncts.DecoderOps validation
 */
export function validation<A, B extends ReadonlyArray<Validation<A, any>>>(...validations: B) {
  return (
    base: Decoder<A>,
  ): Decoder<A & { [K in keyof B]: B[K] extends Validation<any, infer S> ? Brand.Valid<A, S> : never }[number]> =>
    Decoder(
      (u) =>
        base.decode(u).match2(These.left, (warning, value) => {
          let failed = false;
          for (const validation of validations) {
            if (!validation.validate(value)) {
              failed = true;
            }
          }
          if (failed) {
            const error = new BrandedError(base.label, Vector());
            return warning.match(
              () => These.left(error),
              (warning) => These.left(new CompoundError(base.label, Vector(warning, error))),
            );
          }
          return These.rightOrBoth(
            warning,
            value as A & { [K in keyof B]: B[K] extends Validation<any, infer S> ? Brand.Valid<A, S> : never }[number],
          );
        }),
      base.label,
    );
}

/**
 * @tsplus derive fncts.Decoder<_> 10
 */
export function deriveTuple<A extends ReadonlyArray<unknown>>(
  ...[components]: Check<Check.IsTuple<A>> extends Check.True ? [components: { [K in keyof A]: Decoder<A[K]> }] : never
): Decoder<A> {
  const label = `[ ${components.map((d) => d.label).join(", ")} ]`;
  return Decoder((u) => {
    if (Array.isArray(u)) {
      const errors = Vector.emptyPushable<DecodeError>();
      let failed   = false;
      const out    = Array(u.length);
      for (let i = 0; i < components.length; i++) {
        const decoded = components[i]!.decode(u[i]!);
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
    }
    return These.left(new PrimitiveError(u, "Array"));
  }, label);
}

/**
 * @tsplus static fncts.DecoderOps tuple
 */
export function tuple<A extends ReadonlyArray<unknown>>(...components: { [K in keyof A]: Decoder<A[K]> }): Decoder<A> {
  return deriveTuple(components as [never]).unsafeCoerce()
}
