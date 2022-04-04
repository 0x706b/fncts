import { _Nil } from "@fncts/base/collection/immutable/List";
import { EmptyQueue, Queue } from "@fncts/base/collection/immutable/Queue/definition";

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
