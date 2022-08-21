/**
 * @tsplus static fncts.TagOps __call
 */
export function makeTag<T>(id: string): Tag<T> {
  return new Tag(id);
}
