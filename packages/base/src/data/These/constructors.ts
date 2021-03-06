import { Both, Left, Right } from "./definition.js";

/**
 * @tsplus static fncts.TheseOps left
 * @tsplus static fncts.These.Left __call
 */
export function left<E = never, A = never>(e: E): These<E, A> {
  return new Left(e);
}

/**
 * @tsplus static fncts.TheseOps right
 * @tsplus static fncts.These.Right __call
 */
export function right<E = never, A = never>(a: A): These<E, A> {
  return new Right(a);
}

/**
 * @tsplus static fncts.TheseOps both
 * @tsplus static fncts.These.Both __call
 */
export function both<E = never, A = never>(e: E, a: A): These<E, A> {
  return new Both(e, a);
}

/**
 * @tsplus static fncts.TheseOps rightOrBoth
 */
export function rightOrBoth<E = never, A = never>(e: Maybe<E>, a: A): These<E, A> {
  return e.match(
    () => These.right(a),
    (e) => These.both(e, a),
  );
}
