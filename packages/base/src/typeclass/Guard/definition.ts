export interface GuardF extends Guard<any> {}

export const GuardTypeId = Symbol.for("fncts.Guard");
export type GuardTypeId = typeof GuardTypeId;

/**
 * @tsplus type fncts.Guard
 * @tsplus companion fncts.GuardOps
 */
export class Guard<A> {
  readonly _typeId: GuardTypeId = GuardTypeId;
  readonly [HKT.F]!: GuardF;
  readonly [HKT.A]!: () => A;
  readonly [HKT.T]!: Guard<HKT._A<this>>;
  constructor(readonly is: Refinement<unknown, A>) {}
}

/**
 * @tsplus static fncts.GuardOps __call
 */
export function makeGuard<A>(refinement: Refinement<unknown, A>): Guard<A> {
  return new Guard(refinement);
}