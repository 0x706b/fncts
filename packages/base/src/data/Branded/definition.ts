import type { Union } from "@fncts/typelevel";

type Brand_<A, K extends string> = Brand<A, K>;

export declare namespace Branded {
  const Symbol: unique symbol;
  export type Symbol = typeof Symbol;

  export interface Brand<A, K extends string> {
    readonly [Branded.Symbol]: {
      [_ in K]: A;
    };
  }

  export type Type<A extends Brand_<any, any>> = [A] extends [Brand_<infer A, infer K>] ? Validated<A, K> : never;

  export type Validated<A, K extends string> = A & Brand<A, K>;

  export type IsValidated<P extends Brand<any, any>> = {
    [K in keyof P[Branded.Symbol]]: P extends P[Branded.Symbol][K] ? 0 : 1
  }[keyof P[Branded.Symbol]] extends 0 ? unknown : never;

  export type Unbrand<P extends Brand<any, any>> = P extends infer Q & Brands<P> ? Q : P;

  export type Brands<P extends Brand<any, any>> = Union.IntersectionOf<{
    [K in keyof P[Branded.Symbol]]: P extends P[Branded.Symbol][K]
      ? K extends string
        ? Brand<P[Branded.Symbol][K], K>
        : never
      : never;
  }[keyof P[Branded.Symbol]]>;
}

/**
 * @tsplus type fncts.Brand
 * @tsplus companion fncts.BrandOps
 */
export class Brand<A, K extends string> {
  constructor(readonly validate: Refinement<A, A & Branded.Brand<A, K>>) {}
}

/**
 * @tsplus static fncts.BrandOps __call
 */
export function makeBrand<A, K extends string>(p: Predicate<A>): Brand<A, K> {
  return new Brand(p as Refinement<A, A & Branded.Brand<A, K>>);
}
