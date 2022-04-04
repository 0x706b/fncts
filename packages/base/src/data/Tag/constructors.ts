/**
 * @tsplus static fncts.data.TagOps __call
 */
export function makeTag<T>(key: PropertyKey, isOverridable = false): Tag<T> {
  return new Tag(key, isOverridable);
}
