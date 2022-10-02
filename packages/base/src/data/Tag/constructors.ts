import { v4 } from "uuid";

/**
 * @tsplus static fncts.TagOps __call
 */
export function makeTag<T>(/** @fncts id */ id: string = v4()): Tag<T> {
  return new Tag(id);
}
