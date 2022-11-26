export const StateVariance = Symbol.for("fncts.io.State.Variance");
export type StateVariance = typeof StateVariance;

export const StateTypeId = Symbol.for("fncts.io.State");
export type StateTypeId = typeof StateTypeId;

export abstract class StateInternal<S> {
  readonly [StateTypeId]: StateTypeId = StateTypeId;
  declare [StateVariance]: {
    readonly _S: (_: S) => S;
  };
  abstract get: UIO<S>;
  abstract set(s: S, __tsplusTrace?: string): UIO<void>;
  abstract update(f: (s: S) => S, __tsplusTrace?: string): UIO<void>;
}
