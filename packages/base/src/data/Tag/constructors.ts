import type { Has } from "../../prelude/Has.js";
import type { ServiceOf } from "./definition.js";

import { isObject } from "../../util/predicates.js";
import { Tag,TagTypeId  } from "./definition.js";

/**
 * @tsplus static fncts.data.TagOps __call
 */
export function makeTag<T>(key: PropertyKey, isOverridable = false): Tag<T> {
  return new Tag(key, isOverridable);
}
