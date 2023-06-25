import { v4 } from "uuid";

/**
 * @tsplus static fncts.TagOps __call
 */
export function makeTag<T, I = T>(/** @fncts id */ id: string = v4()): Tag<T, I> {
  return new Tag(id);
}
