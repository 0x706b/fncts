import type { Maybe } from "../../../data/Maybe.js";
import type { Predicate } from "../../../data/Predicate.js";

import { NoSuchElementError } from "../../../data/exceptions.js";
import { Just, Nothing } from "../../../data/Maybe.js";
import { List, Nil } from "../List.js";
import { Queue } from "./definition.js";

/**
 * @tsplus getter fncts.collection.immutable.Queue length
 */
export function length<A>(queue: Queue<A>): number {
  return queue._in.length + queue._out.length;
}

/**
 * @tsplus getter fncts.collection.immutable.Queue unsafeHead
 */
export function unsafeHead<A>(queue: Queue<A>): A {
  if (queue._out.isNonEmpty()) {
    return queue._out.unsafeHead;
  } else if (queue._in.isNonEmpty()) {
    return queue._in.unsafeLast;
  } else {
    throw new NoSuchElementError("unsafeHead on empty Queue");
  }
}

/**
 * @tsplus getter fncts.collection.immutable.Queue head
 */
export function head<A>(queue: Queue<A>): Maybe<A> {
  return queue.isEmpty ? Nothing() : Just(queue.unsafeHead);
}

/**
 * @tsplus getter fncts.collection.immutable.Queue unsafeTail
 */
export function unsafeTail<A>(queue: Queue<A>): Queue<A> {
  if (queue._out.isNonEmpty()) {
    return new Queue(queue._in, queue._out.tail);
  } else if (queue._in.isNonEmpty()) {
    return new Queue(List.empty(), queue._in.reverse.unsafeTail);
  } else {
    throw new NoSuchElementError("tail on empty Queue");
  }
}

/**
 * @tsplus getter fncts.collection.immutable.Queue tail
 */
export function tail<A>(queue: Queue<A>): Maybe<Queue<A>> {
  return queue.isEmpty ? Nothing() : Just(queue.unsafeTail);
}

/**
 * @tsplus fluent fncts.collection.immutable.Queue prepend
 */
export function prepend_<A, B>(queue: Queue<A>, elem: B): Queue<A | B> {
  return new Queue(queue._in, queue._out.prepend(elem));
}

/**
 * @tsplus fluent fncts.collection.immutable.Queue enqueue
 */
export function enqueue_<A, B>(queue: Queue<A>, elem: B): Queue<A | B> {
  return new Queue(queue._in.prepend(elem), queue._out);
}

/**
 * @tsplus getter fncts.collection.immutable.Queue unsafeDequeue
 */
export function unasfeDequeue<A>(queue: Queue<A>): readonly [A, Queue<A>] {
  if (queue._out.isEmpty() && queue._in.isNonEmpty()) {
    const rev = queue._in.reverse;
    return [rev.unsafeHead, new Queue(Nil(), rev.unsafeTail)];
  } else if (queue._out.isNonEmpty()) {
    return [queue._out.unsafeHead, new Queue(queue._in, queue._out.unsafeTail)];
  } else {
    throw new NoSuchElementError("unsafeDequeue on empty Queue");
  }
}

/**
 * @tsplus getter fncts.collection.immutable.Queue dequeue
 */
export function dequeue<A>(queue: Queue<A>): Maybe<readonly [A, Queue<A>]> {
  if (queue.isEmpty) {
    return Nothing();
  }
  return Just(queue.unsafeDequeue);
}

/**
 * @tsplus fluent fncts.collection.immutable.Queue map
 */
export function map_<A, B>(fa: Queue<A>, f: (a: A) => B): Queue<B> {
  return new Queue(fa._in.map(f), fa._out.map(f));
}

/**
 * @tsplus fluent fncts.collection.immutable.Queue foldLeft
 */
export function foldLeft_<A, B>(fa: Queue<A>, b: B, f: (b: B, a: A) => B): B {
  let acc   = b;
  let these = fa;
  while (!these.isEmpty) {
    acc   = f(acc, these.unsafeHead);
    these = these.unsafeTail;
  }
  return acc;
}

/**
 * @tsplus fluent fncts.collection.immutable.Queue exists
 */
export function exists_<A>(queue: Queue<A>, p: Predicate<A>): boolean {
  return queue._in.exists(p) || queue._out.exists(p);
}

/**
 * @tsplus fluent fncts.collection.immutable.Queue find
 */
export function find_<A>(queue: Queue<A>, p: Predicate<A>): Maybe<A> {
  let these = queue;
  while (!these.isEmpty) {
    const head = these.unsafeHead;
    if (p(head)) {
      return Just(head);
    }
    these = these.unsafeTail;
  }
  return Nothing();
}

/**
 * @tsplus fluent fncts.collection.immutable.Queue filter
 */
export function filter_<A>(queue: Queue<A>, p: Predicate<A>): Queue<A> {
  return new Queue(queue._in.filter(p), queue._out.filter(p));
}

/**
 * @tsplus fluent fncts.collection.immutable.Queue count
 */
export function count_<A>(queue: Queue<A>, p: Predicate<A>): number {
  return queue.foldLeft(0, (b, a) => (p(a) ? b + 1 : b));
}
