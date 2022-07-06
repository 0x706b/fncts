/**
 * @tsplus type fncts.ConstF
 */
export interface ConstF extends Const<any, any> {}

/**
 * @tsplus type fncts.ConstF
 */
export interface Const1F<E> extends Const1<E, any> {}

/**
 * @tsplus type fncts.Const
 * @tsplus companion fncts.ConstOps
 */
export class Const<E, A> {
  readonly [HKT.F]!: ConstF;
  readonly [HKT.E]!: () => E;
  readonly [HKT.A]!: () => A;
  readonly [HKT.T]!: Const<HKT._E<this>, HKT._A<this>>;
  constructor(readonly getConst: E) {}
}

export interface Const1<E, A> {
  readonly [HKT.F]: ConstF;
  readonly [HKT.E]: () => E;
  readonly [HKT.A]: () => A;
  readonly [HKT.T]: Const<E, HKT._A<this>>;
}
