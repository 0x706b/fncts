export const DifferTypeId = Symbol.for("fncts.io.Differ");
export type DifferTypeId = typeof DifferTypeId;

/**
 * @tsplus type fncts.io.Differ
 * @tsplus companion fncts.io.DifferOps
 */
export abstract class Differ<in out Value, in out Patch> {
  readonly [DifferTypeId]: DifferTypeId = DifferTypeId;
  abstract readonly empty: Patch;
  abstract combine(first: Patch, second: Patch): Patch;
  abstract diff(oldValue: Value, newValue: Value): Patch;
  abstract patch(patch: Patch): (oldValue: Value) => Value;
}
