import type { Union } from "@fncts/typelevel";

import { Eq } from "@fncts/base/typeclass";

import { Struct } from "./definition.js";

export type EnsureLiteral<N> = string extends N ? never : [N] extends [Union.IntersectionOf<N>] ? N : never;

export type TestLiteral<N> = string extends N ? unknown : [N] extends [Union.IntersectionOf<N>] ? N : unknown;

export type EnsureNonexistentProperty<T, N extends string> = Extract<keyof T, N> extends never ? T : never;

export type EnsureLiteralKeys<O> = string extends keyof O ? never : O;

export type EnsureLiteralTuple<A extends ReadonlyArray<unknown>> = unknown extends {
  [K in keyof A]: A[K] extends string ? TestLiteral<A[K]> : unknown;
}[number]
  ? never
  : A;

/**
 * @tsplus static fncts.StructOps __call
 * @tsplus macro identity
 */
export function makeStruct<A>(a: A): Struct<A> {
  return Struct.get(a);
}

/**
 * @tsplus pipeable fncts.Struct set
 */
export function set<N extends string, B>(key: EnsureLiteral<N>, value: B) {
  return <A>(
    self: Struct<A>,
  ): Struct<{
    [P in Exclude<keyof A, N> | N]: P extends Exclude<keyof A, N> ? A[P] : B;
  }> => {
    return Struct.get({ ...self.getStruct, [key]: value }) as Struct<any>;
  };
}

/**
 * @tsplus pipeable fncts.Struct hmap
 */
export function hmap<
  A extends {},
  F extends {
    [N in keyof A]: (a: A[N]) => any;
  },
>(fs: F) {
  return (
    self: Struct<A>,
  ): Struct<{
    readonly [K in keyof F]: ReturnType<F[K]>;
  }> => {
    const keys = self.keys;
    const out  = {} as any;
    for (const key of keys) {
      out[key] = fs[key](unsafeCoerce(self.getStruct[key]));
    }
    return out;
  };
}

/**
 * @tsplus pipeable fncts.Struct modify
 */
export function modify<A, N extends keyof A, B>(key: N, f: (a: A[N]) => B) {
  return (
    self: Struct<A>,
  ): Struct<{
    readonly [P in Exclude<keyof A, N> | N]: P extends Exclude<keyof A, N> ? A[P] : B;
  }> => {
    return Struct.get({ ...self.getStruct, [key]: f(self.getStruct[key]) }) as Struct<any>;
  };
}

/**
 * @tsplus pipeable fncts.Struct pick
 */
export function pick<A, N extends ReadonlyArray<keyof A>>(keys: [...N]) {
  return (
    self: Struct<A>,
  ): Struct<{
    readonly [P in N[number]]: A[P];
  }> => {
    const out = {} as Pick<A, N[number]>;
    for (const key of keys) {
      out[key] = self.getStruct[key];
    }
    return Struct.get(out);
  };
}

/**
 * @tsplus pipeable fncts.Struct omit
 */
export function omit<A extends {}, N extends ReadonlyArray<keyof A>>(keys: [...N]) {
  return (
    self: Struct<A>,
  ): Struct<{
    readonly [P in Exclude<keyof A, N[number]>]: A[P];
  }> => {
    const newKeys = keys.asImmutableArray.difference(self.keys.asImmutableArray, Eq({ equals: (y) => (x) => x === y }));
    const out     = {} as any;
    for (const key of newKeys) {
      out[key] = self.getStruct[key];
    }
    return Struct.get(out);
  };
}

/**
 * @tsplus pipeable fncts.Struct map
 */
export function map<A, B>(f: (a: A[keyof A]) => B) {
  return (self: Struct<A>): Struct<Record<keyof A, B>> => {
    const out  = {} as Record<keyof A, B>;
    const keys = Object.keys(self);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]! as keyof A;
      out[k]  = f(self.getStruct[k]);
    }
    return Struct.get(out);
  };
}

/**
 * @tsplus getter fncts.Struct keys
 */
export function keys<A extends {}>(self: Struct<A>): ReadonlyArray<keyof A> {
  return unsafeCoerce(Object.keys(self.getStruct));
}

/**
 * @tsplus getter fncts.Struct getStruct
 * @tsplus macro identity
 */
export function getStruct<A>(self: Struct<A>): A {
  return Struct.reverseGet(self);
}
