export const enum DatumTag {
  Initial = "Initial",
  Pending = "Pending",
  Refresh = "Refresh",
  Replete = "Replete",
}

export const DatumTypeId = Symbol.for("fncts.Datum");
export type DatumTypeId = typeof DatumTypeId;

export interface DatumF extends HKT {
  type: Datum<this["A"]>;
  variance: {
    A: "+";
  };
}

/**
 * @tsplus type fncts.Datum
 */
export type Datum<A> = Initial | Pending | Refresh<A> | Replete<A>;

/**
 * @tsplus type fncts.DatumOps
 */
export interface DatumOps {}

export const Datum: DatumOps = {};

const datumHash = Hashable.string("fncts.Datum");

const initialHash = Hashable.combine(datumHash, Hashable.string(DatumTag.Initial));

/**
 * @tsplus type fncts.Datum.Initial
 * @tsplus companion fncts.Datum.InitialOps
 */
export class Initial implements Hashable, Equatable {
  readonly _tag = DatumTag.Initial;
  get [Symbol.hash](): number {
    return initialHash;
  }
  [Symbol.equals](that: unknown): boolean {
    return isDatum(that) && that._tag === this._tag;
  }
}

const pendingHash = Hashable.combine(datumHash, Hashable.string(DatumTag.Pending));

/**
 * @tsplus type fncts.Datum.Pending
 * @tsplus companion fncts.Datum.PendingOps
 */
export class Pending implements Hashable, Equatable {
  readonly _typeId: DatumTypeId = DatumTypeId;
  readonly _tag                 = DatumTag.Pending;
  get [Symbol.hash](): number {
    return pendingHash;
  }
  [Symbol.equals](that: unknown): boolean {
    return isDatum(that) && that._tag === this._tag;
  }
}

/**
 * @tsplus type fncts.Datum.Refresh
 * @tsplus companion fncts.Datum.RefreshOps
 */
export class Refresh<A> implements Hashable, Equatable {
  readonly _typeId: DatumTypeId = DatumTypeId;
  readonly _tag                 = DatumTag.Refresh;
  constructor(readonly value: A) {}
  get [Symbol.hash](): number {
    return Hashable.combine(Hashable.combine(datumHash, Hashable.string(this._tag)), Hashable.unknown(this.value));
  }
  [Symbol.equals](that: unknown): boolean {
    return isDatum(that) && this._tag === that._tag && Equatable.strictEquals(this.value, that.value);
  }
}

/**
 * @tsplus type fncts.Datum.Replete
 * @tsplus companion fncts.Datum.RepleteOps
 */
export class Replete<A> implements Hashable, Equatable {
  readonly _typeId: DatumTypeId = DatumTypeId;
  readonly _tag                 = DatumTag.Replete;
  constructor(readonly value: A) {}
  get [Symbol.hash](): number {
    return Hashable.combine(Hashable.combine(datumHash, Hashable.string(this._tag)), Hashable.unknown(this.value));
  }
  [Symbol.equals](that: unknown): boolean {
    return isDatum(that) && this._tag === that._tag && Equatable.strictEquals(this.value, that.value);
  }
}

/**
 * @tsplus static fncts.DatumOps is
 */
export function isDatum(u: unknown): u is Datum<unknown> {
  return hasTypeId(u, DatumTypeId);
}
