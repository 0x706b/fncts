import { hasTypeId } from "../../util/predicates.js";

export const DurationTypeId = Symbol.for("fncts.Duration");
export type DurationTypeId = typeof DurationTypeId;

/**
 * @tsplus type fncts.Duration
 * @tsplus companion fncts.DurationOps
 */
export class Duration implements Equatable, Hashable {
  readonly _typeId: DurationTypeId = DurationTypeId;
  constructor(readonly milliseconds: number) {}

  [Symbol.equals](that: unknown): boolean {
    return isDuration(that) && this.milliseconds === that.milliseconds;
  }

  get [Symbol.hash]() {
    return Hashable.number(this.milliseconds);
  }
}

export function isDuration(u: unknown): u is Duration {
  return hasTypeId(u, DurationTypeId);
}
