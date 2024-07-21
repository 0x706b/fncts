import type { Eq } from "@fncts/base/typeclass";

/**
 * @tsplus static fncts.ArrayOps fromValue
 */
export function fromValue<A>(value: A): A extends Array<any> ? A : A extends ReadonlyArray<any> ? A : ReadonlyArray<A> {
  if (Array.isArray(value)) {
    return value as ReturnType<typeof fromValue<A>>;
  } else {
    return [value] as ReturnType<typeof fromValue<A>>;
  }
}

/**
 * @tsplus getter fncts.Array elem
 * @tsplus getter fncts.ReadonlyArray elem
 */
export function elem<A>(self: ReadonlyArray<A>) {
  return (eq: Eq<A>) =>
    (a: A): boolean => {
      for (let i = 0; i < self.length; i++) {
        if (eq.equals(a)(self[i]!)) {
          return true;
        }
      }
      return false;
    };
}

/**
 * @tsplus pipeable fncts.Array filterMap
 * @tsplus pipeable fncts.ReadonlyArray filterMap
 */
export function filterMap<A, B>(f: (a: A) => Maybe<B>) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => {
    const out: Array<B> = [];
    for (let i = 0; i < self.length; i++) {
      const v = f(self[i]!);
      Maybe.concrete(v);
      if (v._tag === MaybeTag.Just) {
        out.push(v.value);
      }
    }
    return out;
  };
}

/**
 * @tsplus pipeable fncts.Array filterMap
 * @tsplus pipeable fncts.ReadonlyArray filterMap
 */
export function filterMapUndefined<A, B>(f: (a: A) => B | undefined) {
  return (self: ReadonlyArray<A>): ReadonlyArray<B> => {
    const out: Array<B> = [];
    for (let i = 0; i < self.length; i++) {
      const v = f(self[i]!);
      if (v !== undefined) {
        out.push(v);
      }
    }
    return out;
  };
}

/**
 * @tsplus fluent fncts.Array isEmpty
 * @tsplus fluent fncts.ReadonlyArray isEmpty
 */
export function isEmpty<A>(self: ReadonlyArray<A>): boolean {
  return self.length === 0;
}

/**
 * @tsplus fluent fncts.Array isNonEmpty
 * @tsplus fluent fncts.ReadonlyArray isNonEmpty
 */
export function isNonEmpty<A>(self: ReadonlyArray<A>): self is ReadonlyNonEmptyArray<A> {
  return self.length > 0;
}

/**
 * @tsplus pipeable fncts.Array foldLeft
 * @tsplus pipeable fncts.ReadonlyArray foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: ReadonlyArray<A>): B => {
    return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
  };
}

/**
 * @tsplus pipeable fncts.Array foldLeftWithIndex
 * @tsplus pipeable fncts.ReadonlyArray foldLeftWithIndex
 */
export function foldLeftWithIndex<A, B>(b: B, f: (i: number, b: B, a: A) => B) {
  return (self: ReadonlyArray<A>): B => {
    let out = b;
    for (let i = 0; i < self.length; i++) {
      out = f(i, out, self[i]!);
    }
    return out;
  };
}

/**
 * @tsplus pipeable fncts.Array updateAt
 * @tsplus pipeable fncts.ReadonlyArray updateAt
 */
export function updateAt<A>(i: number, a: A) {
  return (self: ReadonlyArray<A>): ReadonlyArray<A> => {
    if (i in self) {
      const copy = self.slice();
      copy[i]    = a;
      return copy;
    }
    return self;
  };
}

/**
 * @tsplus pipeable fncts.Array groupBy
 * @tsplus pipeable fncts.ReadonlyArray groupBy
 */
export function groupBy<A, K extends PropertyKey>(f: (a: A) => K) {
  return (self: ReadonlyArray<A>): Record<K, ReadonlyArray<A>> => {
    const out = {} as Record<K, Array<A>>;
    for (let i = 0; i < self.length; i++) {
      const a = self[i]!;
      const k = f(a);
      (out[k] ??= []).push(a);
    }
    return out;
  };
}
