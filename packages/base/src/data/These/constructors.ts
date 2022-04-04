import { Both, Left, Right } from "./definition.js";

/**
 * @tsplus static fncts.data.TheseOps left
 * @tsplus static fncts.data.These.Left __call
 */
export function left<E = never, A = never>(e: E): These<E, A> {
  return new Left(e);
}

/**
 * @tsplus static fncts.data.TheseOps right
 * @tsplus static fncts.data.These.Right __call
 */
export function right<E = never, A = never>(a: A): These<E, A> {
  return new Right(a);
}

/**
 * @tsplus static fncts.data.TheseOps both
 * @tsplus static fncts.data.These.Both __call
 */
export function both<E = never, A = never>(e: E, a: A): These<E, A> {
  return new Both(e, a);
}
