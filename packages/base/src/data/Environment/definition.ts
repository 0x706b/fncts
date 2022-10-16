import type { EnvironmentPatch } from "@fncts/base/data/EnvironmentPatch";

/**
 * @tsplus static fncts.prelude.builtin.SymbolOps env
 */
export const EnvSymbol = Symbol.for("fncts.Env");

export type EnvSymbol = typeof EnvSymbol;

/**
 * @tsplus type fncts.Environment
 * @tsplus companion fncts.EnvironmentOps
 */
export class Environment<R> implements Hashable, Equatable {
  readonly _typeId: EnvSymbol = EnvSymbol;
  readonly [EnvSymbol]!: (_: never) => R;
  constructor(
    readonly map: HashMap<Tag<any>, unknown>,
    public cache: HashMap<Tag<any>, unknown> = HashMap.empty(),
  ) {}

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
  return hasTypeId(u, EnvSymbol);
}
