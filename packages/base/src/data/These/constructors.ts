import { Both, Left, Right } from "./definition.js";

/**
 * Constructs a `Left` value.
 *
 * @tsplus static fncts.TheseOps left
 *
 * @tsplus static fncts.These.Left __call
 */
export function left<E = never, A = never>(e: E): These<E, A> {
  return new Left(e);
}

/**
 * Constructs a `Right` value.
 *
 * @tsplus static fncts.TheseOps right
 *
 * @tsplus static fncts.These.Right __call
 */
export function right<E = never, A = never>(a: A): These<E, A> {
  return new Right(a);
}

/**
 * Constructs a `Both` value.
 *
 * @tsplus static fncts.TheseOps both
 *
 * @tsplus static fncts.These.Both __call
 */
export function both<E = never, A = never>(e: E, a: A): These<E, A> {
  return new Both(e, a);
}

/**
 * Constructs `Right` when the optional left is empty, otherwise `Both`.
 *
 * @tsplus static fncts.TheseOps rightOrBoth
 */
export function rightOrBoth<E = never, A = never>(e: Maybe<E>, a: A): These<E, A> {
  return e.match(
    () => These.right(a),
    (e) => These.both(e, a),
  );
}
