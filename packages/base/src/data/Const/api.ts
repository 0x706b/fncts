import type { Const } from "./definition.js";

/**
 * @tsplus fluent fncts.data.Const map
 */
export function map_<E, A, B>(self: Const<E, A>, _f: (a: A) => B): Const<E, B> {
  return unsafeCoerce(self);
}

/**
 * @tsplus static fncts.data.ConstOps make
 * @tsplus static fncts.data.ConstOps __call
 */
export function mkConst<E, A = never>(e: E): Const<E, A> {
  return unsafeCoerce(e);
}
