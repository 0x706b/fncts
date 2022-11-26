export interface GuardF extends HKT {
  readonly type: Guard<this["A"]>;
}

export const GuardVariance = Symbol.for("fncts.Guard.Variance");
export type GuardVariance = typeof GuardVariance;

export const GuardTypeId = Symbol.for("fncts.Guard");
export type GuardTypeId = typeof GuardTypeId;

/**
 * @tsplus type fncts.Guard
 * @tsplus companion fncts.GuardOps
 */
export class Guard<A> {
  readonly [GuardTypeId]: GuardTypeId = GuardTypeId;
  declare [GuardVariance]: {
    readonly _A: (_: never) => A;
  };
  constructor(readonly is: Refinement<unknown, A>) {}
}

/**
 * @tsplus static fncts.GuardOps __call
 */
export function makeGuard<A>(refinement: Refinement<unknown, A>): Guard<A> {
  return new Guard(refinement);
}
