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
 * Represents a rose tree node with a value and child forest.
 *
 * @tsplus type fncts.RoseTree
 *
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

  /**
   * Compares two rose trees by node value and child forest reference.
   */
  [Symbol.equals](that: unknown): boolean {
    return isRoseTree(that) ? Equatable.strictEquals(this.value, that.value) && this.forest == that.forest : false;
  }

  /**
   * Computes a hash from the tree type, value, and child forest.
   */
  get [Symbol.hash]() {
    let h = Hashable.symbol(RoseTreeTypeId);
    h    ^= Hashable.unknown(this.value);
    h    ^= Hashable.unknown(this.forest);
    return Hashable.optimize(h);
  }
}

/**
 * Returns true when the input is a rose tree instance.
 */
export function isRoseTree(u: unknown): u is RoseTree<unknown> {
  return isObject(u) && RoseTreeTypeId in u;
}
