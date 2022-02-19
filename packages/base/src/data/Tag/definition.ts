import type { Has, HasTypeId } from "../../prelude";

import { isObject } from "../../util/predicates";
import { Maybe, Nothing } from "../Maybe";

export const TagTypeId = Symbol.for("fncts.data.Tag");
export type TagTypeId = typeof TagTypeId;

/**
 * Tag Encodes capabilities of reading and writing a service T into a generic environment
 *
 * @tsplus type fncts.data.Tag
 * @tsplus companion fncts.data.TagOps
 */
export class Tag<T> {
  readonly _typeId: TagTypeId = TagTypeId;
  readonly _T!: T;
  constructor(
    readonly def: boolean = false,
    readonly key: PropertyKey = Symbol()
  ) {}
  readonly overridable = (): Tag<T> => new Tag(true, this.key);
  readonly fixed       = (): Tag<T> => new Tag(false, this.key);
  readonly refine      = <T1 extends T>(): Tag<T1> => new Tag(this.def, this.key);
  readonly read        = (r: Has<T>): T => r[this.key as HasTypeId] as any;
  readonly readOption  = (r: unknown): Maybe<T> =>
    isObject(r) ? Maybe.fromNullable(r[this.key]) : Nothing();
  readonly setKey = (s: PropertyKey): Tag<T> => new Tag(this.def, s);
  readonly of     = (_: T): Has<T> => ({ [this.key]: _ } as any);
}
