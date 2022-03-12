import { _Nil, Cons } from "../List.js";
import { EmptyQueue, Queue } from "./definition.js";

/**
 * @tsplus static fncts.collection.immutable.QueueOps empty
 */
export function empty<A>(): Queue<A> {
  return EmptyQueue;
}

/**
 * @tsplus static fncts.collection.immutable.QueueOps single
 */
export function single<A>(a: A): Queue<A> {
  return new Queue(_Nil, Cons(a, _Nil));
}
