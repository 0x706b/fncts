import type { Check } from "@fncts/typelevel/Check";

import { CompoundError, MissingKeyError, OptionalKeyError, RequiredKeyError } from "@fncts/base/data/DecodeError";

/**
 * @tsplus derive fncts.Decoder<_> 15
 */
export function deriveDecoder<A extends Record<string, any>>(
  ...[keyGuard, valueDecoder, requiredKeysRecord]: [A] extends [Record<infer X, infer Y>]
    ? Check<Check.Not<Check.IsUnion<A>> & Check.IsEqual<A, Record<X, Y>>> extends Check.True
      ? [keyGuard: Guard<X>, valueDecoder: Decoder<Y>, requiredKeysRecord: { [k in X]: 0 }]
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
