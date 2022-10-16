import type { Brand, Validation } from "@fncts/base/data/Branded";
import type { Check } from "@fncts/typelevel";
import type { Literal } from "@fncts/typelevel/Any";
import type { OptionalKeys, RequiredKeys } from "@fncts/typelevel/Object";

import { Guard } from "@fncts/base/data/Guard/definition";
import { AssertionError } from "@fncts/base/util/assert";
import { isNull, isUndefined } from "@fncts/base/util/predicates";

/**
 * @tsplus pipeable fncts.Guard __call
 */
export function is(u: unknown) {
  // @ts-expect-error
  return <A>(self: Guard<A>): u is A => {
    return self.is(u);
  };
}

/**
 * @tsplus pipeable fncts.Guard refine
 * @tsplus operator fncts.Guard &&
 */
export function refine<A, B extends A>(refinement: Refinement<A, B>): (self: Guard<A>) => Guard<B>;
export function refine<A>(predicate: Predicate<A>): (self: Guard<A>) => Guard<A>;
export function refine<A>(predicate: Predicate<A>) {
  return (self: Guard<A>): Guard<A> => {
    return Guard(self.is && predicate);
  };
}

/**
 * @tsplus pipeable fncts.Guard assert
 */
export function assert(u: unknown) {
  // @ts-expect-error
  return <A>(self: Guard<A>): asserts u is A => {
    if (!self.is(u)) {
      throw new AssertionError("Guard check failed");
    }
  };
}

/**
 * @tsplus implicit
 * @tsplus static fncts.GuardOps unknown
 */
export const unknown: Guard<unknown> = Guard((_): _ is unknown => true);

/**
 * @tsplus implicit
 * @tsplus static fncts.GuardOps undefined
 */
export const _undefined: Guard<undefined> = Guard(isUndefined);

/**
 * @tsplus implicit
 * @tsplus static fncts.GuardOps null
 */
export const _null: Guard<null> = Guard(isNull);

/**
 * @tsplus implicit
 * @tsplus static fncts.GuardOps string
 */
export const string: Guard<string> = String.Guard;

/**
 * @tsplus implicit
 * @tsplus static fncts.GuardOps number
 */
export const number: Guard<number> = Number.Guard;

/**
 * @tsplus implicit
 * @tsplus static fncts.GuardOps boolean
 */
export const boolean: Guard<boolean> = Boolean.Guard;

/**
 * @tsplus implicit
 * @tsplus static fncts.GuardOps bigint
 */
export const bigint: Guard<bigint> = BigInt.Guard;

/**
 * @tsplus static fncts.GuardOps object
 */
export const object: Guard<{}> = Object.Guard;

/**
 * @tsplus static fncts.GuardOps nullable
 */
export function nullable<A>(base: Guard<A>): Guard<A | null | undefined> {
  return Derive();
}

/**
 * @tsplus derive fncts.Guard lazy
 * @tsplus static fncts.GuardOps lazy
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
 * @tsplus derive fncts.Guard<_> 10
 */
export function deriveEmptyObject<A extends {}>(
  ..._: Check<Check.IsEqual<A, {}>> extends Check.True ? [] : never
): Guard<A> {
  return Guard((u): u is A => typeof u === "object" && u !== null);
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
 * @tsplus static fncts.GuardOps literal
 */
export function literal<A extends Literal>(value: A): Guard<A> {
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
 * @tsplus static fncts.GuardOps struct
 */
export function struct<A extends Record<string, any>>(fields: { [K in keyof A]: Guard<A[K]> }): Guard<A> {
  return Guard((u): u is A => {
    if (!isObject(u)) {
      return false;
    }
    for (const key in fields) {
      if (!(key in u) || !fields[key].is(u[key])) {
        return false;
      }
    }
    return true;
  });
}

/**
 * @tsplus static fncts.GuardOps partial
 */
export function partial<A extends Record<string, any>>(fields: { [K in keyof A]: Guard<A[K]> }): Guard<Partial<A>> {
  return Guard((u): u is A => {
    if (!isObject(u)) {
      return false;
    }
    for (const key in fields) {
      if (key in u && typeof u[key] !== "undefined" && !fields[key].is(u[key])) {
        return false;
      }
    }
    return true;
  });
}

/**
 * @tsplus derive fncts.Guard<|> 30
 * @tsplus static fncts.GuardOps union
 */
export function deriveUnion<A extends unknown[]>(
  ...members: {
    [K in keyof A]: Guard<A[K]>;
  }
): Guard<A[number]> {
  return Guard((u): u is A[number] => {
    for (const member of members) {
      if (member.is(u)) {
        return true;
      }
    }
    return false;
  });
}

/**
 * @tsplus derive fncts.Guard[fncts.Array]<_> 10
 */
export function deriveArray<A extends Array<any>>(
  ...[element]: [A] extends [Array<infer _A>]
    ? Check<Check.IsEqual<A, Array<_A>>> extends Check.True
      ? [element: Guard<_A>]
      : never
    : never
): Guard<A> {
  return Guard((u): u is A => {
    if (Array.isArray(u)) {
      return u.every(element.is);
    }
    return false;
  });
}

/**
 * @tsplus static fncts.GuardOps array
 * @tsplus static fncts.ArrayOps Guard
 */
export function array<A>(/** @tsplus implicit local */ base: Guard<A>): Guard<Array<A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Guard[fncts.ReadonlyArray]<_> 10
 */
export const deriveReadonlyArray: <A extends ReadonlyArray<any>>(
  ...[element]: [A] extends [ReadonlyArray<infer _A>]
    ? Check<Check.IsEqual<A, ReadonlyArray<_A>>> extends Check.True
      ? [element: Guard<_A>]
      : never
    : never
) => Guard<A> = unsafeCoerce(deriveArray);

/**
 * @tsplus static fncts.GuardOps readonlyArray
 * @tsplus static fncts.ReadonlyArrayOps Guard
 */
export function readonlyArray<A>(/** @tsplus implicit local */ base: Guard<A>): Guard<ReadonlyArray<A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Guard<_> 15
 */
export function deriveRecord<A extends Record<string, any>>(
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
 * @tsplus derive fncts.Guard<_> 15
 */
export function deriveDictionary<A extends Record<string, any>>(
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
 * @tsplus static fncts.GuardOps record
 * @tsplus static fncts.GuardOps record
 */
export function record<A>(codomain: Guard<A>): Guard<Record<string, A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Guard[fncts.ImmutableArray]<_> 10
 */
export function deriveImmutableArray<A extends ImmutableArray<any>>(
  ...[element]: [A] extends [ImmutableArray<infer A>] ? [element: Guard<A>] : never
): Guard<A> {
  return Guard((u): u is A => {
    if (ImmutableArray.is(u)) {
      return u._array.every(element.is);
    }
    return false;
  });
}

/**
 * @tsplus static fncts.GuardOps immutableArray
 */
export function immutableArray<A>(base: Guard<A>): Guard<ImmutableArray<A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Guard[fncts.ImmutableNonEmptyArray]<_> 10
 */
export function deriveImmutableNonEmptyArray<A extends ImmutableNonEmptyArray<any>>(
  ...[elem]: [A] extends [ImmutableNonEmptyArray<infer _A>] ? [elem: Guard<_A>] : never
): Guard<A> {
  return Guard((u): u is A => {
    if (ImmutableNonEmptyArray.is(u)) {
      return u.every(elem.is);
    }
    return false;
  });
}

/**
 * @tsplus static fncts.GuardOps immutableNonEmptyArray
 */
export function immutableNonEmptyArray<A>(base: Guard<A>): Guard<ImmutableNonEmptyArray<A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Guard[fncts.Conc]<_> 10
 */
export function deriveConc<A extends Conc<any>>(
  ...[elem]: [A] extends [Conc<infer _A>] ? [elem: Guard<_A>] : never
): Guard<A> {
  return Guard((u): u is A => {
    if (Conc.is(u)) {
      return u.every(elem.is);
    }
    return false;
  });
}

/**
 * @tsplus static fncts.GuardOps conc
 */
export function conc<A>(base: Guard<A>): Guard<Conc<A>> {
  return Derive();
}

/**
 * @tsplus derive fncts.Guard<_> 10
 */
export function deriveValidation<A extends Brand.Valid<any, any>>(
  ...[base, brands]: Check<Brand.IsValidated<A>> extends Check.True
    ? [
        base: Guard<Brand.Unbranded<A>>,
        brands: {
          [K in keyof A[Brand.valid] & string]: Validation<A[Brand.valid][K], K>;
        },
      ]
    : never
): Guard<A> {
  const validations = Object.values(brands) as ReadonlyArray<Validation<A, any>>;
  return Guard((u): u is A => base.is(u) && validations.every((brand) => brand.validate(u)));
}

/**
 * @tsplus static fncts.GuardOps validation
 */
export function validation<A, B extends ReadonlyArray<Validation<A, any>>>(...validations: B) {
  return (
    base: Guard<A>,
  ): Guard<A & { [K in keyof B]: B[K] extends Validation<any, infer S> ? Brand.Valid<A, S> : never }[number]> =>
    Guard(
      (u): u is A & { [K in keyof B]: B[K] extends Validation<any, infer S> ? Brand.Valid<A, S> : never }[number] => {
        if (!base.is(u)) {
          return false;
        }
        for (const validation of validations) {
          if (!validation.validate(u)) {
            return false;
          }
        }
        return true;
      },
    );
}

/**
 * @tsplus derive fncts.Guard<_> 10
 */
export function deriveTuple<A extends ReadonlyArray<unknown>>(
  ...[components]: Check<Check.IsTuple<A>> extends Check.True ? [components: { [K in keyof A]: Guard<A[K]> }] : never
): Encoder<A> {
  return Encoder((inp) => {
    for (let i = 0; i < inp.length; i++) {
      if (!components[i]!.is(inp[i])) {
        return false;
      }
    }
    return true;
  });
}

/**
 * @tsplus static fncts.GuardOps tuple
 */
export function tuple<A extends ReadonlyArray<unknown>>(...components: { [K in keyof A]: Guard<A[K]> }): Guard<A> {
  return deriveTuple(components.unsafeCoerce()).unsafeCoerce();
}
