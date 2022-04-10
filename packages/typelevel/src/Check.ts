import type * as Union from "./Union.js";

type EqualsWrapped<T> = T extends infer R & {}
  ? {
      [P in keyof R]: R[P];
    }
  : never;

declare const True: unique symbol;
declare const False: unique symbol;

/**
 * @tsplus type fncts.Check
 */
export type Check<Condition> = [Condition] extends [never] ? Check.False : Check.True;

export declare namespace Check {
  /**
   * @tsplus type fncts.Check.True
   */
  type True = typeof True;

  /**
   * @tsplus type fncts.Check.False
   */
  type False = typeof False;

  /**
   * @tsplus type fncts.Check.Result
   */
  type Result = True | False;

  /**
   * @tsplus type fncts.Check.Not
   */
  type Not<A> = [A] extends [never] ? unknown : never;

  /**
   * @tsplus type fncts.Check.Extends
   */
  type Extends<A, B> = [A] extends [never] ? never : [A] extends [B] ? unknown : never;

  /**
   * @tsplus type fncts.Check.IsUnion
   */
  type IsUnion<T> = [T] extends [Union.IntersectionOf<T>] ? never : unknown;

  /**
   * @tsplus type fncts.Check.IsEqual
   */
  type IsEqual<A, B> = (<T>() => T extends EqualsWrapped<A> ? 1 : 2) extends <
    T,
  >() => T extends EqualsWrapped<B> ? 1 : 2
    ? unknown
    : never;

  /**
   * @tsplus type fncts.Check.IsLiteral
   */
  type IsLiteral<A extends string | number> = Not<Extends<string, A> | Extends<number, A>>;

  /**
   * @tsplus type fncts.Check.IsStruct
   */
  type IsStruct<A> = Extends<keyof A, string> & Not<IsUnion<A>>;

  /**
   * @tsplus type fncts.Check.HaveSameLength
   */
  type HaveSameLength<A extends { length: number }, B extends { length: number }> = IsEqual<
    A["length"],
    B["length"]
  >;

  /**
   * @tsplus type fncts.Check.IsTagged
   */
  type IsTagged<Tag extends PropertyKey, A extends { [k in Tag]: string }> = IsUnion<A[Tag]> &
    IsUnion<A> &
    HaveSameLength<Union.ListOf<A[Tag]>, Union.ListOf<A>>;

  /**
   * @tsplus type fncts.Check.If
   */
  type If<B, Then, Else = never> = B extends never ? Else : Then;

  /**
   * @tsplus type fncts.Check.Or
   */
  type Or<A, B> = A extends never ? B : A;
}
