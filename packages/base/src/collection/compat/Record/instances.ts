import type { Check } from "@fncts/typelevel/Check";

import { CompoundError, MissingKeyError, OptionalKeyError, RequiredKeyError } from "@fncts/base/data/DecodeError";

/**
 * @tsplus derive fncts.Guard<_> 15
 */
export function deriveDictionaryGuard<A extends Record<string, any>>(
  ...[value]: Check<Check.IsDictionary<A>> extends Check.True ? [value: Guard<A[keyof A]>] : never
): Guard<A> {
  return Guard((u): u is A => {
    if (!Derive<Guard<{}>>().is(u)) {
      return false;
    }
    for (const k of Object.keys(u)) {
      if (!value.is(u[k])) {
        return false;
      }
    }
    return true;
  });
}

/**
 * @tsplus derive fncts.Guard<_> 15
 */
export function deriveGuard<A extends Record<string, any>>(
  ...[key, value, requiredKeys]: Check<Check.IsRecord<A>> extends Check.True
    ? [
        key: Guard<keyof A>,
        value: Guard<A[keyof A]>,
        requiredKeys: {
          [k in keyof A]: 0;
        },
      ]
    : never
): Guard<A> {
  const requiredKeysSet = new Set(Object.keys(requiredKeys));
  return Guard((record): record is A => {
    const missing = new Set(requiredKeysSet);
    if (!Derive<Guard<{}>>().is(record)) {
      return false;
    }
    for (const k of Object.keys(record)) {
      if (requiredKeysSet.has(k) && !value.is(record[k])) {
        return false;
      }
      missing.delete(k);
    }
    return missing.size === 0;
  });
}

/**
 * @tsplus derive fncts.Decoder<_> 15
 */
export function deriveDecoder<A extends Record<string, any>>(
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
    const recordResult = Derive<Decoder<{}>>().decode(u);
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
 * @tsplus derive fncts.Encoder<_> 15
 */
export function deriveDictionaryEncoder<A extends Record<string, any>>(
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
export function deriveEncoder<A extends Record<string, any>>(
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
