/**
 * @tsplus static fncts.prelude.builtin.SymbolOps env
 */
export const EnvSymbol = Symbol.for("fncts.data.Env");

export type EnvSymbol = typeof EnvSymbol;

/**
 * @tsplus type fncts.data.Environment
 * @tsplus companion fncts.data.EnvironmentOps
 */
export class Environment<R> implements Hashable, Equatable {
  readonly _typeId: EnvSymbol = EnvSymbol;
  readonly [EnvSymbol]!: (_: never) => R;
  constructor(readonly cache: HashMap<Tag<unknown>, unknown>) {}

  get [Symbol.hashable](): number {
    return Hashable.hash(this.cache);
  }

  [Symbol.equatable](that: unknown): boolean {
    return isEnvironment(that) ? Equatable.strictEquals(this.cache, that.cache) : false;
  }
}

export function isEnvironment(u: unknown): u is Environment<unknown> {
  return hasTypeId(u, EnvSymbol);
}
