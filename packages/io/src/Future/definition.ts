export const FutureTypeId = Symbol.for("fncts.io.Future");
export type FutureTypeId = typeof FutureTypeId;

export const FutureVariance = Symbol.for("fncts.io.Future.Variance");
export type FutureVariance = typeof FutureVariance;

/**
 * @tsplus type fncts.io.Future
 * @tsplus companion fncts.io.FutureOps
 */
export class Future<in out E, in out A> {
  readonly [FutureTypeId]: FutureTypeId = FutureTypeId;
  declare FutureVariance: {
    readonly _A: (_: A) => A;
    readonly _E: (_: E) => E;
  };
  constructor(
    public state: State<E, A>,
    readonly blockingOn: FiberId,
  ) {}
}

export declare namespace Future {
  type ErrorOf<X> = [X] extends [{ [FutureVariance]: { _E: (_: infer E) => infer E } }] ? E : never;
  type ValueOf<X> = [X] extends [{ [FutureVariance]: { _A: (_: infer A) => infer A } }] ? A : never;
}

export const enum FutureStateTag {
  Done,
  Pending,
}

export class Pending<E, A> {
  readonly _tag = FutureStateTag.Pending;
  constructor(readonly joiners: List<(_: FIO<E, A>) => void>) {}
}

export class Done<E, A> {
  readonly _tag = FutureStateTag.Done;
  constructor(readonly value: FIO<E, A>) {}
}

export type State<E, A> = Done<E, A> | Pending<E, A>;
