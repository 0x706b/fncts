import type { Eq } from "@fncts/base/typeclass";

/**
 * @tsplus getter fncts.Array elem
 * @tsplus getter fncts.ReadonlyArray elem
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
 * @tsplus fluent fncts.Array foldLeft
 * @tsplus fluent fncts.ReadonlyArray foldLeft
 */
export function foldLeft<A, B>(self: ReadonlyArray<A>, b: B, f: (b: B, a: A) => B): B {
  return self.foldLeftWithIndex(b, (_, b, a) => f(b, a));
}

/**
 * @tsplus fluent fncts.Array foldLeftWithIndex
 * @tsplus fluent fncts.ReadonlyArray foldLeftWithIndex
 */
export function foldLeftWithIndex<A, B>(self: ReadonlyArray<A>, b: B, f: (i: number, b: B, a: A) => B): B {
  let out = b;
  for (let i = 0; i < self.length; i++) {
    out = f(i, b, self[i]!);
  }
  return out;
}
