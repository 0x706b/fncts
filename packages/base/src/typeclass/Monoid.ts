import type { Check } from "@fncts/typelevel/Check";
import type { OptionalKeys, RequiredKeys } from "@fncts/typelevel/Object";

import { Semigroup } from "@fncts/base/typeclass/Semigroup";

/**
 * @tsplus type fncts.Monoid
 */
export interface Monoid<A> extends Semigroup<A> {
  readonly nat: A;
}

/**
 * @tsplus type fncts.MonoidOps
 */
export interface MonoidOps {}

export const Monoid: MonoidOps = {};

export type MonoidMin<A> = Semigroup<A> & {
  readonly nat: A;
};

/**
 * @tsplus static fncts.MonoidOps __call
 */
export function mkMonoid<A>(F: MonoidMin<A>): Monoid<A> {
  return {
    ...Semigroup(F),
    nat: F.nat,
  };
}

/**
 * @tsplus derive fncts.Monoid lazy
 */
export function deriveLazy<A>(fn: (_: Monoid<A>) => Monoid<A>): Monoid<A> {
  let cached: Monoid<A> | undefined;
  const M: Monoid<A> = Monoid({
    combine: (y) => (x) => {
      if (!cached) {
        cached = fn(M);
      }
      return cached.combine(y)(x);
    },
    get nat() {
      if (!cached) {
        cached = fn(M);
      }
      return cached.nat;
    },
  });
  return M;
}

/**
 * @tsplus derive fncts.Monoid<_> 20
 */
export function deriveStruct<A extends Record<string, any>>(
  ...args: Check<Check.IsStruct<A>> extends Check.True
    ? [
        ...[
          requiredFields: {
            [K in RequiredKeys<A>]: Monoid<A[K]>;
          },
        ],
        ...([OptionalKeys<A>] extends [never]
          ? []
          : [
              optionalFields: {
                [K in OptionalKeys<A>]: Monoid<NonNullable<A[K]>>;
              },
            ]),
      ]
    : never
): Monoid<A> {
  const [requiredFields, optionalFields] = args;
  const nat: Record<string, unknown>     = {};
  for (const field in requiredFields) {
    nat[field] = (requiredFields[field] as Monoid<any>).nat;
  }
  for (const field in optionalFields) {
    nat[field] = (optionalFields[field] as Monoid<any>).nat;
  }
  return Monoid({
    ...Semigroup.deriveStruct<A>(...args),
    nat: nat as A,
  });
}
