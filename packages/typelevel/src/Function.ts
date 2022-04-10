import type { Try } from "@fncts/typelevel/Any";

export type Narrowable = string | number | boolean | bigint;

export type Exact<A, B> = B extends unknown
  ? A extends B
    ? A extends Narrowable
      ? A
      : {
          [K in keyof A]: K extends keyof B ? Exact<A[K], B[K]> : never;
        }
    : B
  : never;

export type NoInfer<A> = [A][A extends any ? 0 : never];

type NarrowRaw<A> =
  | (A extends [] ? [] : never)
  | (A extends Narrowable ? A : never)
  | {
      [K in keyof A]: A[K] extends Function ? A[K] : NarrowRaw<A[K]>;
    };

export type Narrow<A> = Try<A, [], NarrowRaw<A>>;
