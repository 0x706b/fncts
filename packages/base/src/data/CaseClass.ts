import type { Equals } from "@fncts/typelevel/Any";
import type { True } from "@fncts/typelevel/Boolean";

export const CaseClassTypeId = Symbol.for("fncts.CaseClass");
export type CaseClassTypeId = typeof CaseClassTypeId;

const keysSymbol = Symbol.for("fncts.CaseClass.keys");
const argsSymbol = Symbol.for("fncts.CaseClass.args");

export interface CaseArgs {
  readonly [CaseClassTypeId]: ImmutableArray<string>;
}

export interface Copy<T> {
  copy(args: Equals<T, {}> extends 1 ? void : Partial<T>): this;
}

export interface CaseConstructor {
  [CaseClassTypeId]: ImmutableArray<string>;
  new <T>(args: Equals<T, {}> extends True ? void : T): T & Copy<T> & CaseArgs;
}

export function isCaseClass(u: unknown): u is CaseConstructor {
  return isObject(u) && CaseClassTypeId in u;
}

const hash0 = Hashable.string("fncts.CaseClass");

// @ts-expect-error
export const CaseClass: CaseConstructor = class<T extends Record<PropertyKey, any>>
  implements Hashable, Equatable, CaseArgs
{
  private [argsSymbol]: T;
  private [keysSymbol]: ImmutableArray<string> = ImmutableArray.empty();
  constructor(args: T) {
    this[argsSymbol] = args;
    this[keysSymbol] = args ? Object.keys(args).asImmutableArray : ImmutableArray.empty();
    Object.assign(this, args);
  }

  get [CaseClassTypeId](): ImmutableArray<string> {
    return this[keysSymbol];
  }

  get [Symbol.hash](): number {
    let h = hash0;
    for (const k of this[keysSymbol]) {
      h = Hashable.combine(h, Hashable.unknown(this[k]!));
    }
    return h;
  }

  [Symbol.equals](that: unknown): boolean {
    if (this === that) {
      return true;
    }
    if (that instanceof this.constructor) {
      const thatKeys: readonly string[] = (that as T)[CaseClassTypeId];
      const len = thatKeys.length;
      if (len !== this[keysSymbol].length) {
        return false;
      }

      let result = true;
      let i      = 0;

      while (result && i < len) {
        result =
          this[keysSymbol][i] === thatKeys[i] &&
          Equatable.strictEquals(this[this[keysSymbol]![i]!] as {}, (that as T)[thatKeys[i]!]);
        i++;
      }

      return result;
    }
    return false;
  }

  copy(args: Partial<T>): this {
    // @ts-expect-error
    return new this.constructor({ ...this[argsSymbol], ...args });
  }
};

export interface CaseConstructorTagged<Tag extends string | symbol, K extends string | symbol> {
  new <T>(args: Equals<T, {}> extends true ? void : T): T &
    Copy<T> & {
      readonly [k in K]: Tag;
    };
}

export function Tagged<Tag extends string | symbol, Key extends string | symbol>(
  tag: Tag,
  key: Key,
): CaseConstructorTagged<Tag, Key>;
export function Tagged<Tag extends string | symbol>(tag: Tag): CaseConstructorTagged<Tag, "_tag">;
export function Tagged<Tag extends string | symbol, Key extends string | symbol>(
  tag: Tag,
  key?: Key,
): CaseConstructorTagged<Tag, string> {
  if (key) {
    class X extends CaseClass<{}> {
      // @ts-expect-error
      readonly [key] = tag;
    }
    // @ts-expect-error
    return X;
  }
  class X extends CaseClass<{}> {
    readonly _tag = tag;
  }

  // @ts-expect-error
  return X;
}
