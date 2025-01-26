import { v4 } from "uuid";

/**
 * @tsplus static fncts.TagOps __call
 */
export function makeTag<T, I = T>(/** @fncts id */ id: string = v4()): Tag.TagClass<T, I> {
  function TagClass() {}
  Object.setPrototypeOf(TagClass, Object.getPrototypeOf(Tag<T, I>));
  TagClass.id = id;
  return TagClass as any;
}
