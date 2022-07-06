import type { Check } from "@fncts/typelevel/Check";
import type { OptionalKeys, RequiredKeys } from "@fncts/typelevel/Object";

/**
 * @tsplus derive fncts.Guard lazy
 */
export function deriveLazy<A>(f: (_: Guard<A>) => Guard<A>): Guard<A> {
  let cached: Guard<A> | undefined;
  const guard: Guard<A> = Guard((u: unknown): u is A => {
    if (!cached) {
      cached = f(guard);
    }
    return cached.is(u);
  });
  return guard;
}

/**
 * @tsplus derive fncts.Guard<_> 20
 */
export function deriveLiteral<A extends string | number | boolean>(
  ...[value]: Check<Check.IsLiteral<A> & Check.Not<Check.IsUnion<A>>> extends Check.True ? [value: A] : never
): Guard<A> {
  return Guard((u): u is A => u === value);
}

/**
 * @tsplus derive fncts.Guard<_> 20
 */
export function deriveStruct<A extends Record<string, any>>(
  ...[requiredFields, optionalFields]: Check<Check.IsStruct<A>> extends Check.True
    ? [
        ...[
          requiredFields: {
            [k in RequiredKeys<A>]: Guard<A[k]>;
          },
        ],
        ...([OptionalKeys<A>] extends [never]
          ? []
          : [
              optionalFields: {
                [k in OptionalKeys<A>]: Guard<NonNullable<A[k]>>;
              },
            ]),
      ]
    : never
): Guard<A> {
  return Guard((u): u is A => {
    if (!isObject(u)) {
      return false;
    }

    for (const key in requiredFields) {
      if (!(key in u) || !(requiredFields[key] as Guard<any>).is(u[key])) {
        return false;
      }
    }
    if (optionalFields) {
      for (const key in optionalFields) {
        if (key in u && typeof u[key] !== "undefined" && !(optionalFields[key] as Guard<any>).is(u[key])) {
          return false;
        }
      }
    }
    return true;
  });
}

/**
 * @tsplus derive fncts.Guard<|> 30
 */
export function deriveUnion<A extends unknown[]>(...members: { [K in keyof A]: Guard<A[K]> }): Guard<A[number]> {
  return Guard((u): u is A[number] => {
    for (const member of members) {
      if (member.is(u)) {
        return true;
      }
    }
    return false;
  });
}
