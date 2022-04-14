import { _Nil } from "@fncts/base/collection/immutable/List";
import { EmptyQueue, Queue } from "@fncts/base/collection/immutable/Queue/definition";

/**
 * @tsplus static fncts.ImmutableQueueOps empty
 */
export function empty<A>(): Queue<A> {
  return EmptyQueue;
}

/**
 * @tsplus static fncts.ImmutableQueueOps single
 */
export function single<A>(a: A): Queue<A> {
  return new Queue(_Nil, Cons(a, _Nil));
}
