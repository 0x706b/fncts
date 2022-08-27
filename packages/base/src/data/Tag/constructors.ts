import { v4 } from "uuid";

/**
 * @tsplus static fncts.TagOps __call
 * @fncts tag
 */
export function makeTag<T>(id: string = v4()): Tag<T> {
  return new Tag(id);
}
