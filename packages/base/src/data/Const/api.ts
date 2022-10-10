import { Const } from "./definition.js";

/**
 * @tsplus pipeable fncts.Const map
 */
export function map<A, B>(_f: (a: A) => B) {
  return <E>(self: Const<E, A>): Const<E, B> => {
    return new Const(self.getConst);
  };
}

/**
 * @tsplus static fncts.ConstOps make
 * @tsplus static fncts.ConstOps __call
 */
export function makeConst<E, A = never>(e: E): Const<E, A> {
  return new Const(e);
}
