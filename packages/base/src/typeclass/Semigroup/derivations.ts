import type { Check } from "@fncts/typelevel/Check";
import type { OptionalKeys, RequiredKeys } from "@fncts/typelevel/Object";

import { Semigroup } from "@fncts/base/typeclass/Semigroup/definition";

/**
 * @tsplus derive fncts.Semigroup lazy
 */
export function deriveLazy<A>(fn: (_: Semigroup<A>) => Semigroup<A>): Semigroup<A> {
  let cached: Semigroup<A> | undefined;
  const eq: Semigroup<A> = Semigroup({
    combine: (x, y) => {
      if (!cached) {
        cached = fn(eq);
      }
      return cached.combine(x, y);
    },
  });
  return eq;
}

/**
 * @tsplus derive fncts.Semigroup<_> 20
 * @tsplus static fncts.SemigroupOps deriveStruct
 */
export function deriveStruct<A extends Record<string, any>>(
  ...[requiredFields, optionalFields]: Check<Check.IsStruct<A>> extends Check.True
    ? [
        ...[
          requiredFields: {
            [K in RequiredKeys<A>]: Semigroup<A[K]>;
          },
        ],
        ...([OptionalKeys<A>] extends [never]
          ? []
          : [
              optionalFields: {
                [K in OptionalKeys<A>]: Semigroup<NonNullable<A[K]>>;
              },
            ]),
      ]
    : never
): Semigroup<A> {
  return Semigroup({
    combine: (x, y) => {
      const out: Record<string, unknown> = {};
      for (const field in requiredFields) {
        out[field] = (requiredFields[field]! as Semigroup<any>).combine(x[field], y[field]);
      }
      for (const field in optionalFields) {
        const xf = x[field];
        const yf = y[field];
        if (!(field in x)) {
          out[field] = yf;
        } else if (!(field in y)) {
          out[field] = xf;
        } else {
          out[field] = optionalFields[field].combine(xf, yf);
        }
      }
      return out as A;
    },
  });
}
