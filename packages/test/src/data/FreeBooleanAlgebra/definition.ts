export const enum FreeBooleanAlgebraTag {
  Value = "Value",
  And = "And",
  Or = "Or",
  Not = "Not",
}

export class Value<A> {
  readonly _tag = FreeBooleanAlgebraTag.Value;
  constructor(readonly value: A) {}
}

export class And<A> {
  readonly _tag = FreeBooleanAlgebraTag.And;
  constructor(readonly left: FreeBooleanAlgebra<A>, readonly right: FreeBooleanAlgebra<A>) {}
}

export class Or<A> {
  readonly _tag = FreeBooleanAlgebraTag.Or;
  constructor(readonly left: FreeBooleanAlgebra<A>, readonly right: FreeBooleanAlgebra<A>) {}
}

export class Not<A> {
  readonly _tag = FreeBooleanAlgebraTag.Not;
  constructor(readonly result: FreeBooleanAlgebra<A>) {}
}

/**
 * @tsplus type fncts.test.FreeBooleanAlgebra
 */
export type FreeBooleanAlgebra<A> = Value<A> | And<A> | Or<A> | Not<A>;

/**
 * @tsplus type fncts.test.FreeBooleanAlgebraOps
 */
export interface FreeBooleanAlgebraOps {}

export const FreeBooleanAlgebra: FreeBooleanAlgebraOps = {};
