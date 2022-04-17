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
    readonly map: HashMap<Tag<unknown>, readonly [unknown, number]>,
    readonly index: number,
    public cache: HashMap<Tag<unknown>, unknown> = HashMap.makeDefault(),
  ) {}

  get [Symbol.hashable](): number {
    return Hashable.hash(this.cache);
  }

  [Symbol.equatable](that: unknown): boolean {
    return isEnvironment(that) ? this.map == that.map : false;
  }
}

export function isEnvironment(u: unknown): u is Environment<unknown> {
  return hasTypeId(u, EnvSymbol);
}
