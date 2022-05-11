import { Const } from "./definition.js";

/**
 * @tsplus fluent fncts.Const map
 */
export function map_<E, A, B>(self: Const<E, A>, _f: (a: A) => B): Const<E, B> {
  return new Const(self.getConst);
}

/**
 * @tsplus static fncts.ConstOps make
 * @tsplus static fncts.ConstOps __call
 */
export function mkConst<E, A = never>(e: E): Const<E, A> {
  return new Const(e);
}
