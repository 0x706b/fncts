export const RoseTreeVariance = Symbol.for("fncts.RoseTree.Variance");
export type RoseTreeVariance = typeof RoseTreeVariance;

export const RoseTreeTypeId = Symbol.for("fncts.RoseTree");
export type RoseTreeTypeId = typeof RoseTreeTypeId;

export interface RoseTreeF extends HKT {
  type: RoseTree<this["A"]>;
  variance: {
    A: "+";
  };
}

/**
 * @tsplus type fncts.RoseTree
 * @tsplus companion fncts.RoseTreeOps
 */
export class RoseTree<A> implements Hashable, Equatable {
  readonly [RoseTreeTypeId]: RoseTreeTypeId = RoseTreeTypeId;
  declare [RoseTreeVariance]: {
    readonly _A: (_: never) => A;
  };
  constructor(
    readonly value: A,
    readonly forest: Vector<RoseTree<A>>,
  ) {}

  [Symbol.equals](that: unknown): boolean {
    return isRoseTree(that) ? Equatable.strictEquals(this.value, that.value) && this.forest == that.forest : false;
  }

  get [Symbol.hash]() {
    let h = Hashable.symbol(RoseTreeTypeId);
    h    ^= Hashable.unknown(this.value);
    h    ^= Hashable.unknown(this.forest);
    return Hashable.optimize(h);
  }
}

export function isRoseTree(u: unknown): u is RoseTree<unknown> {
  return isObject(u) && RoseTreeTypeId in u;
}
