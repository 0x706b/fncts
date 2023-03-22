import type { Union } from "@fncts/typelevel";
declare const validSym: unique symbol;
export declare namespace Brand {
  export type valid = typeof validSym;

  /**
   * @tsplus derive nominal
   */
  export interface Valid<in out A, in out K extends string> {
    [validSym]: {
      [_ in K]: A;
    };
  }

  export type Type<A extends Validation<any, any>> = A extends Validation<infer A, infer K> ? Validated<A, K> : never;

  export type Validated<A, K extends string> = A & Brand.Valid<A, K>;

  export type IsValidated<P extends Valid<any, any>> = {
    [K in keyof P[Brand.valid]]: P extends P[Brand.valid][K] ? 0 : 1;
  }[keyof P[Brand.valid]] extends 0
    ? unknown
    : never;

  export type Unbranded<P> = P extends infer Q & Brands<P> ? Q : P;
  export type Brands<P> = P extends Valid<any, any>
    ? Union.IntersectionOf<
        {
          [K in keyof P[Brand.valid]]: P extends P[Brand.valid][K]
            ? K extends string
              ? Valid<P[Brand.valid][K], K>
              : never
            : never;
        }[keyof P[Brand.valid]]
      >
    : unknown;
}

/**
 * @tsplus type fncts.Validation
 * @tsplus companion fncts.ValidationOps
 * @tsplus derive nominal
 */
export class Validation<in out A, in out K extends string> {
  constructor(readonly validate: Refinement<A, A & Brand.Valid<A, K>>, readonly name: K) {}
}

/**
 * @tsplus static fncts.ValidationOps __call
 */
export function makeValidation<A, K extends string>(p: Predicate<A>, name: K): Validation<A, K> {
  return new Validation(p as Refinement<A, A & Brand.Valid<A, K>>, name);
}
