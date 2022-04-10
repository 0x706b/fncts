import type { Cast, Equals, Extends, Is, Match } from "./Any.js";
import type { False,True } from "./Boolean.js";
import type { List, Prepend } from "./List.js";

export type IntersectionOf<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

export type Last<U> = IntersectionOf<U extends unknown ? (x: U) => void : never> extends (
  x: infer P,
) => void
  ? P
  : never;

type _ListOf<U, LN extends List = [], LastU = Last<U>> = Extends<[U], [never]> extends False
  ? _ListOf<Exclude<U, LastU>, Prepend<LN, LastU>>
  : LN;

export type ListOf<U> = _ListOf<U> extends infer X ? Cast<X, List> : never;

export type Has<A, B> = [B] extends [A] ? True : False;

export type Select<U, M, _ extends Match = "default"> = U extends unknown
  ? {
      [False]: never;
      [True]: U & M;
    }[Is<U, M, _>]
  : never;

export type Filter<U, M, _ extends Match = "default"> = U extends unknown
  ? {
      [False]: U & M;
      [True]: never;
    }[Is<U, M, _>]
  : never;

export type Intersect<A, B> = A extends unknown
  ? B extends unknown
    ? { [True]: A; [False]: never }[Equals<A, B>]
    : never
  : never;

export type Exclude<A, B> = A extends B ? never : A;

export type Pop<U> = Exclude<U, Last<U>>;