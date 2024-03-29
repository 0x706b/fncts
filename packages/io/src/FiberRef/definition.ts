import { globalValue } from "@fncts/base/data/Global";
import { AtomicNumber } from "@fncts/base/internal/AtomicNumber";

export const FiberRefVariance = Symbol.for("fncts.io.FiberRef.Variance");
export type FiberRefVariance = typeof FiberRefVariance;

export const FiberRefTypeId = Symbol.for("fncts.io.FiberRef");
export type FiberRefTypeId = typeof FiberRefTypeId;

/**
 * @tsplus type fncts.io.FiberRef
 * @tsplus companion fncts.io.FiberRefOps
 */
export abstract class FiberRef<Value> {
  readonly [FiberRefTypeId]: FiberRefTypeId = FiberRefTypeId;
  declare [FiberRefVariance]: {
    readonly _Value: (_: Value) => Value;
  };
  readonly _Patch!: unknown;
}

export declare namespace FiberRef {
  interface WithPatch<Value, Patch> extends FiberRef<Value> {
    readonly _Patch: Patch;
  }
}

const FiberRefCounterId = Symbol.for("fncts.io.FiberRef.FiberRefCounter");

const fiberRefCounter = globalValue(FiberRefCounterId, () => new AtomicNumber(0));

/**
 * @tsplus type fncts.io.FiberRef
 */
export class FiberRefInternal<Value, Patch> extends FiberRef<Value> implements Hashable, Equatable {
  readonly _Patch!: Patch;
  private readonly id = fiberRefCounter.getAndIncrement();
  constructor(
    readonly _initial: Value,
    readonly _diff: (oldValue: Value, newValue: Value) => Patch,
    readonly _combine: (first: Patch, second: Patch) => Patch,
    readonly _patch: (patch: Patch) => (oldValue: Value) => Value,
    readonly _fork: Patch,
    readonly _join: (oldValue: Value, newValue: Value) => Value,
  ) {
    super();
  }

  get [Symbol.hash]() {
    let hash = Hashable.string("FiberRef");
    hash    ^= Hashable.number(this.id);
    return hash;
  }

  [Symbol.equals](that: unknown) {
    return isFiberRef(that) && (concrete(that), this.id === that.id);
  }
}

export function isFiberRef(u: unknown): u is FiberRef<unknown> {
  return isObject(u) && FiberRefTypeId in u;
}

type Concrete<Value, Patch> = FiberRefInternal<Value, Patch>;

/**
 * @tsplus macro remove
 */
export function concrete<A, P>(_: FiberRef.WithPatch<A, P>): asserts _ is Concrete<A, P>;
export function concrete<A>(_: FiberRef<A>): asserts _ is Concrete<A, unknown>;
export function concrete<A>(_: FiberRef<A>): asserts _ is Concrete<A, unknown> {
  //
}
