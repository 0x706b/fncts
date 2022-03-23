import type { Equatable } from "../../prelude.js";

import { Hashable } from "../../prelude.js";
import { hasTypeId } from "../../util/predicates.js";

export const DurationTypeId = Symbol.for("fncts.data.Duration");
export type DurationTypeId = typeof DurationTypeId;

/**
 * @tsplus type fncts.data.Duration
 * @tsplus companion fncts.data.DurationOps
 */
export class Duration implements Equatable, Hashable {
  readonly _typeId: DurationTypeId = DurationTypeId;
  constructor(readonly milliseconds: number) {}

  [Symbol.equatable](that: unknown): boolean {
    return isDuration(that) && this.milliseconds === that.milliseconds;
  }

  get [Symbol.hashable]() {
    return Hashable.hashNumber(this.milliseconds);
  }
}

export function isDuration(u: unknown): u is Duration {
  return hasTypeId(u, DurationTypeId);
}
