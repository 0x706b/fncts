import type { Equals } from "@fncts/typelevel/Any";

import { Equatable, Hashable } from "../prelude.js";
import { hasTypeId } from "../util/predicates.js";

export const CaseClassTypeId = Symbol.for("fncts.data.CaseClass");
export type CaseClassTypeId = typeof CaseClassTypeId;

const keysSymbol = Symbol.for("fncts.data.CaseClass.keys");
const argsSymbol = Symbol.for("fncts.data.CaseClass.args");

export interface CaseArgs {
  readonly [CaseClassTypeId]: ReadonlyArray<string>;
}

export interface Copy<T> {
  copy(args: Equals<T, {}> extends 1 ? void : Partial<T>): this;
}

export interface CaseConstructor {
  [CaseClassTypeId]: ReadonlyArray<string>;
  new <T>(args: Equals<T, {}> extends 1 ? void : T): T & Copy<T> & CaseArgs;
}

export function isCaseClass(u: unknown): u is CaseConstructor {
  return hasTypeId(u, CaseClassTypeId);
}

const hash0 = Hashable.hashString("fncts.data.CaseClass");

// @ts-expect-error
export const CaseClass: CaseConstructor = class<T> implements Hashable, Equatable, CaseArgs {
  private [argsSymbol]: T;
  private [keysSymbol]: ReadonlyArray<string> = [];
  constructor(args: T) {
    this[argsSymbol] = args;
    this[keysSymbol] = args ? Object.keys(args) : [];
    Object.assign(this, args);
  }

  get [CaseClassTypeId](): ReadonlyArray<string> {
    return this[keysSymbol];
  }

  get [Symbol.hashable](): number {
    let h = hash0;
    for (const k of this[keysSymbol]) {
      h = Hashable.combineHash(h, Hashable.hash(this[k]!));
    }
    return h;
  }

  [Symbol.equatable](that: unknown): boolean {
    if (this === that) {
      return true;
    }
    if (that instanceof this.constructor) {
      const kthat = that[CaseClassTypeId];
      const len   = kthat.length;
      if (len !== this[keysSymbol].length) {
        return false;
      }

      let result = true;
      let i      = 0;

      while (result && i < len) {
        result =
          this[keysSymbol][i] === kthat[i] &&
          Equatable.strictEquals(this[this[keysSymbol]![i]!], that[kthat[i]]);
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
  new <T>(args: Equals<T, {}> extends true ? void : T): T & Copy<T> & { readonly [k in K]: Tag };
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
