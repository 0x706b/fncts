import type { EnvironmentPatch } from "@fncts/base/data/EnvironmentPatch";

export const EnvironmentVariance = Symbol.for("fncts.Environment.Variance");
export type EnvironmentVariance = typeof EnvironmentVariance;

export const EnvironmentTypeId = Symbol.for("fncts.Environment");
export type EnvironmentTypeId = typeof EnvironmentTypeId;

/**
 * @tsplus type fncts.Environment
 * @tsplus companion fncts.EnvironmentOps
 */
export class Environment<R> implements Hashable, Equatable {
  readonly [EnvironmentTypeId]: EnvironmentTypeId = EnvironmentTypeId;
  declare [EnvironmentVariance]: {
    _R: (_: never) => R;
  };
  constructor(readonly map: HashMap<Tag<any>, unknown>, public cache: HashMap<Tag<any>, unknown> = HashMap.empty()) {}

  get [Symbol.hash](): number {
    return Hashable.unknown(this.cache);
  }

  [Symbol.equals](that: unknown): boolean {
    return isEnvironment(that) ? this.map == that.map : false;
  }
}

export declare namespace Environment {
  type Patch<In, Out> = EnvironmentPatch<In, Out>;
}

export function isEnvironment(u: unknown): u is Environment<unknown> {
  return isObject(u) && EnvironmentTypeId in u;
}
