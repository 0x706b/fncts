import { Tag } from "./definition.js";

/**
 * @tsplus static fncts.data.TagOps __call
 */
export function tag<T>(key?: PropertyKey): Tag<T> {
  return new Tag(false, key);
}
