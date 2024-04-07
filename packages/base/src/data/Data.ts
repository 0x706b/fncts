import type { Equals } from "@fncts/typelevel/Any";
import type { True } from "@fncts/typelevel/Boolean";

export interface Copy<T> {
  copy(args: Equals<T, {}> extends True ? void : Partial<T>): this;
}

export interface DataClassConstructor {
  new <T>(
    args: Equals<T, {}> extends True
      ? void
      : { readonly [P in keyof T as P extends keyof Equatable ? never : P]: T[P] },
  ): Readonly<T> & Copy<T>;
}

const keysSymbol = Symbol.for("fncts.Data.keys");

abstract class StructuralPrototype implements Equatable, Hashable {
  abstract [keysSymbol]: ReadonlyArray<any>;

  get [Symbol.hash](): number {
    return Hashable.plainObject(this);
  }
  [Symbol.equals](that: unknown): boolean {
    if (!isObject(that)) {
      return false;
    }
    const selfKeys = Object.keys(this);
    const thatKeys = Object.keys(that);
    if (selfKeys.length !== thatKeys.length) {
      return false;
    }
    for (const key of selfKeys) {
      if (!(key in that) && Equatable.strictEquals((this as any)[key], that[key])) {
        return false;
      }
    }
    return true;
  }
  copy(args: void | object) {
    if (!args) {
      if (this[keysSymbol].length === 0) {
        // @ts-expect-error
        return new this.constructor();
      }

      const properties = {} as Record<any, any>;
      for (const k of this[keysSymbol]) {
        properties[k] = (this as any)[k];
      }
      // @ts-expect-error
      return new this.constructor(properties);
    }

    const properties = {} as Record<any, any>;
    for (const k of this[keysSymbol]) {
      if (k in (args as any)) {
        properties[k] = (args as any)[k];
      } else {
        properties[k] = (this as any)[k];
      }
    }

    // @ts-expect-error
    return new this.constructor(properties);
  }
}

const Structural: new <A>(
  args: Equals<Omit<A, keyof Equatable>, {}> extends True
    ? void
    : { readonly [P in keyof A as P extends keyof Equatable ? never : P]: A[P] },
) => {} = (function () {
  return class Structural extends StructuralPrototype {
    readonly [keysSymbol]: ReadonlyArray<any> = [];

    constructor(args: any) {
      super();
      if (args) {
        this[keysSymbol] = Object.keys(args);
        Object.assign(this, args);
      }
    }
  };
})();

export const DataClass: DataClassConstructor = Structural as any;

export interface TaggedDataClassConstructor<Tag extends string | symbol, K extends string | symbol> {
  new <T extends Record<string, any> = {}>(
    args: Equals<T, {}> extends True ? void : T,
  ): {
    readonly [P in keyof T as P extends Tag ? never : P]: T[P];
  } & Copy<T> & {
      readonly [k in K]: Tag;
    };
}

export const TaggedClass = <Tag extends string | symbol, Key extends string | symbol = "_tag">(
  tag: Tag,
  key?: Key,
): TaggedDataClassConstructor<Tag, Key> => {
  if (key) {
    class Base extends Structural<any> {
      // @ts-expect-error
      readonly [key] = tag;
    }
    return Base as any;
  }

  class Base extends Structural<any> {
    readonly _tag = tag;
  }
  return Base as any;
};

export function struct<As extends Readonly<Record<string, any>>>(as: As): As {
  return Object.assign(Object.create(StructuralPrototype.prototype), as);
}

export const Error: new <A extends Record<string, any> = {}>(
  args: Equals<A, {}> extends True ? void : { readonly [P in keyof A]: A[P] },
) => Error & Readonly<A> = (function () {
  return class Base extends globalThis.Error {
    constructor(args: any) {
      super();
      if (args) {
        Object.assign(this, args);
      }
    }
  } as any;
})();

export function TaggedError<Tag extends string>(
  tag: Tag,
): new <A extends Record<string, any> = {}>(
  args: Equals<A, {}> extends True ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P] },
) => Error & { readonly _tag: Tag } & Readonly<A> {
  class Base extends Error<{}> {
    readonly _tag = tag;
  }
  Base.prototype.name = tag;
  return Base as any;
}
