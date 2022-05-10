import type { Eq } from "@fncts/base/typeclass";

/**
 * @tsplus getter fncts.base.Array elem
 * @tsplus getter fncts.base.ReadonlyArray elem
 */
export function elem<A>(self: ReadonlyArray<A>) {
  return (eq: Eq<A>) =>
    (a: A): boolean => {
      for (let i = 0; i < self.length; i++) {
        if (eq.equals(self[i]!, a)) {
          return true;
        }
      }
      return false;
    };
}

/**
 * @tsplus fluent fncts.base.Array isEmpty
 * @tsplus fluent fncts.base.ReadonlyArray isEmpty
 */
export function isEmpty<A>(self: ReadonlyArray<A>): boolean {
  return self.length === 0;
}

/**
 * @tsplus fluent fncts.base.Array isNonEmpty
 * @tsplus fluent fncts.base.ReadonlyArray isNonEmpty
 */
export function isNonEmpty<A>(self: ReadonlyArray<A>): self is ReadonlyNonEmptyArray<A> {
  return self.length > 0;
}

/**
 * @tsplus fluent fncts.base.Array foldLeft
 * @tsplus fluent fncts.base.ReadonlyArray foldLeft
 */
export function foldLeft<A, B>(self: ReadonlyArray<A>, b: B, f: (b: B, a: A) => B): B {
  return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
}

/**
 * @tsplus fluent fncts.base.Array foldLeftWithIndex
 * @tsplus fluent fncts.base.ReadonlyArray foldLeftWithIndex
 */
export function foldLeftWithIndex<A, B>(self: ReadonlyArray<A>, b: B, f: (i: number, b: B, a: A) => B): B {
  let out = b;
  for (let i = 0; i < self.length; i++) {
    out = f(i, b, self[i]!);
  }
  return out;
}
