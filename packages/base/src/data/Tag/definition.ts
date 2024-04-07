export const TagVariance = Symbol.for("fncts.Tag.Variance");
export type TagVariance = typeof TagVariance;

export const TagTypeId = Symbol.for("fncts.Tag");
export type TagTypeId = typeof TagTypeId;

const _tagHash = Hashable.string("fncts.Tag");

const IOTypeId = Symbol.for("fncts.io.IO");
type IOTypeId = typeof IOTypeId;

/**
 * Tag Encodes capabilities of reading and writing a service T into a generic environment
 *
 * @tsplus type fncts.Tag
 * @tsplus companion fncts.TagOps
 */
export class Tag<in out T, in out Identifier = T> implements Hashable, Equatable {
  readonly _ioOpCode                  = null;
  readonly _tag                       = "Tag";
  readonly [TagTypeId]: TagTypeId     = TagTypeId;
  readonly [IOTypeId]: IOTypeId       = IOTypeId;
  readonly trace?: string | undefined = undefined;
  declare [TagVariance]: {
    readonly _T: (_: T) => T;
    readonly _Identifier: (_: Identifier) => Identifier;
  };

  constructor(readonly id: string) {}

  get [Symbol.hash](): number {
    return Hashable.combine(_tagHash, Hashable.string(this.id));
  }

  [Symbol.equals](that: unknown): boolean {
    return isTag(that) && this.id === that.id;
  }
}

export declare namespace Tag {
  export type Service<T> = T extends Tag<infer A, any> ? A : never;
  export type Identifier<T> = T extends Tag<any, infer A> ? A : never;
}

export function isTag(u: unknown): u is Tag<unknown> {
  return isObject(u) && TagTypeId in u;
}

/**
 * @tsplus unify fncts.Tag
 */
export function unifyIO<X extends Tag<any, any>>(self: X): X {
  return self;
}
