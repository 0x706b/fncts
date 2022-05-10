import type { Check } from "@fncts/typelevel/Check";
import type { OptionalKeys, RequiredKeys } from "@fncts/typelevel/Object";

import { Eq } from "@fncts/base/typeclass/Eq/definition";

/**
 * @tsplus derive fncts.Eq lazy
 */
export function deriveLazy<A>(fn: (_: Eq<A>) => Eq<A>): Eq<A> {
  let cached: Eq<A> | undefined;
  const eq: Eq<A> = Eq({
    equals: (x, y) => {
      if (!cached) {
        cached = fn(eq);
      }
      return cached.equals(x, y);
    },
  });
  return eq;
}

/**
 * @tsplus derive fncts.Eq<_> 20
 */
export function deriveStruct<A extends Record<string, any>>(
  ...[requiredFields, optionalFields]: Check<Check.IsStruct<A>> extends Check.True
    ? [
        ...[
          requiredFields: {
            [K in RequiredKeys<A>]: Eq<A[K]>;
          },
        ],
        ...([OptionalKeys<A>] extends [never]
          ? []
          : [
              optionalFields: {
                [K in OptionalKeys<A>]: Eq<NonNullable<A[K]>>;
              },
            ]),
      ]
    : never
): Eq<A> {
  return Eq({
    equals: (x, y) => {
      for (const field in requiredFields) {
        if (!(requiredFields[field] as Eq<any>).equals(x[field], y[field])) {
          return false;
        }
      }
      for (const field in optionalFields) {
        if ((field in x && !(field in y)) || (field in y && !(field in x))) {
          return false;
        }
        if (!(optionalFields[field] as Eq<any>).equals(x[field], y[field])) {
          return false;
        }
      }
      return true;
    },
  });
}
