import type { Has, HasTypeId } from "../../prelude.js";
import type { Tag } from "./definition.js";

import { hasTypeId } from "../../util/predicates.js";
import { TagTypeId } from "./definition.js";

/**
 * @tsplus static fncts.data.TagOps isTag
 */
export function isTag(u: unknown): u is Tag<unknown> {
  return hasTypeId(u, TagTypeId);
}

/**
 * @tsplus fluent fncts.data.Tag mergeEnvironments
 */
export function mergeEnvironments<T, R1>(tag: Tag<T>, r: R1, t: T): R1 & Has<T> {
  return tag.def && (r[tag.key as keyof R1] as any)
    ? r
    : ({
        ...r,
        [tag.key]: t,
      } as any);
}

/**
 * Replaces the service with the required Service Entry, in the specified environment
 */
export function replaceServiceIn_<R, T>(r: R & Has<T>, tag: Tag<T>, f: (t: T) => T): R & Has<T> {
  return {
    ...r,
    [tag.key]: f(r[tag.key as HasTypeId] as any),
  } as any;
}
