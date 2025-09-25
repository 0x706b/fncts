import type { Check } from "@fncts/typelevel/Check";
import type { OptionalKeys, RequiredKeys } from "@fncts/typelevel/Object";

import { Eq } from "@fncts/base/data/Eq";

/**
 * @tsplus derive fncts.Eq lazy
 */
export function deriveLazy<A>(fn: (_: Eq<A>) => Eq<A>): Eq<A> {
  let cached: Eq<A> | undefined;
  const eq: Eq<A> = Eq({
    equals: (y) => (x) => {
      if (!cached) {
        cached = fn(eq);
      }
      return cached.equals(y)(x);
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
  return Eq.struct<any, any>(requiredFields, optionalFields);
}

/**
 * @tsplus derive fncts.Eq<|> 30
 */
export function deriveUnion<A extends ReadonlyArray<unknown>>(
  ...members: {
    [K in keyof A]: Eq<A[K]>;
  }
): Eq<A[number]> {
  return Eq.union(members);
}
