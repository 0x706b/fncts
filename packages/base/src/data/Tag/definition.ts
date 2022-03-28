import type { Has, HasTypeId } from "../../prelude.js";
import type { Maybe } from "../Maybe.js";

import { isObject } from "../../util/predicates.js";
import { Nothing } from "../Maybe.js";

export const TagTypeId = Symbol.for("fncts.data.Tag");
export type TagTypeId = typeof TagTypeId;

export interface ServiceOf<T> {
  (service: T): Has<T>;
}

/**
 * Tag Encodes capabilities of reading and writing a service T into a generic environment
 *
 * @tsplus type fncts.data.Tag
 * @tsplus companion fncts.data.TagOps
 */
export class Tag<T> {
  readonly _T!: T;
  readonly _typeId: TagTypeId = TagTypeId;
  constructor(readonly key: PropertyKey, readonly isOverridable: boolean) {}
}
