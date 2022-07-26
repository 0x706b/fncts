/**
 * @tsplus type fncts.ConstF
 */
export interface ConstF extends HKT {
  type: Const<this["E"], this["A"]>;
  variance: {
    E: "_";
    A: "+";
  };
}

/**
 * @tsplus type fncts.Const
 * @tsplus companion fncts.ConstOps
 */
export class Const<E, A> {
  readonly _E!: () => E;
  readonly _A!: () => A;
  constructor(readonly getConst: E) {}
}
