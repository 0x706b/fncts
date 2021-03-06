import { AtomicNumber } from "@fncts/base/internal/AtomicNumber";

export const TagTypeId = Symbol.for("fncts.Tag");
export type TagTypeId = typeof TagTypeId;

const _tagHash = Hashable.string("fncts.Tag");

/**
 * Tag Encodes capabilities of reading and writing a service T into a generic environment
 *
 * @tsplus type fncts.Tag
 * @tsplus companion fncts.TagOps
 */
export class Tag<T> implements Hashable, Equatable {
  readonly _T!: (_: never) => T;
  readonly _typeId: TagTypeId = TagTypeId;
  private static counter      = new AtomicNumber(0);
  readonly id                 = Tag.counter.getAndIncrement();

  get [Symbol.hash](): number {
    return Hashable.combine(_tagHash, Hashable.number(this.id));
  }

  [Symbol.equals](that: unknown): boolean {
    return isTag(that) && this.id === that.id;
  }
}

export function isTag(u: unknown): u is Tag<unknown> {
  return hasTypeId(u, TagTypeId);
}
