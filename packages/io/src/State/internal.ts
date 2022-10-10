export const StateTypeId = Symbol.for("fncts.base.control.State");
export type StateTypeId = typeof StateTypeId;

export abstract class StateInternal<S> {
  declare _A: () => S;
  readonly _typeId: StateTypeId = StateTypeId;
  abstract get: UIO<S>;
  abstract set(s: S, __tsplusTrace?: string): UIO<void>;
  abstract update(f: (s: S) => S, __tsplusTrace?: string): UIO<void>;
}
