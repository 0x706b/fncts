import { Queue } from "@fncts/base/collection/immutable/Queue/definition";

/**
 * @tsplus getter fncts.ImmutableQueue length
 */
export function length<A>(queue: Queue<A>): number {
  return queue._in.length + queue._out.length;
}

/**
 * @tsplus getter fncts.ImmutableQueue unsafeHead
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
 * @tsplus getter fncts.ImmutableQueue head
 */
export function head<A>(queue: Queue<A>): Maybe<A> {
  return queue.isEmpty ? Nothing() : Just(queue.unsafeHead);
}

/**
 * @tsplus getter fncts.ImmutableQueue unsafeTail
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
 * @tsplus getter fncts.ImmutableQueue tail
 */
export function tail<A>(queue: Queue<A>): Maybe<Queue<A>> {
  return queue.isEmpty ? Nothing() : Just(queue.unsafeTail);
}

/**
 * @tsplus pipeable fncts.ImmutableQueue prepend
 */
export function prepend<B>(elem: B) {
  return <A>(queue: Queue<A>): Queue<A | B> => {
    return new Queue(queue._in, queue._out.prepend(elem));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableQueue enqueue
 */
export function enqueue<B>(elem: B) {
  return <A>(queue: Queue<A>): Queue<A | B> => {
    return new Queue(queue._in.prepend(elem), queue._out);
  };
}

/**
 * @tsplus getter fncts.ImmutableQueue unsafeDequeue
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
 * @tsplus getter fncts.ImmutableQueue dequeue
 */
export function dequeue<A>(queue: Queue<A>): Maybe<readonly [A, Queue<A>]> {
  if (queue.isEmpty) {
    return Nothing();
  }
  return Just(queue.unsafeDequeue);
}

/**
 * @tsplus pipeable fncts.ImmutableQueue map
 */
export function map<A, B>(f: (a: A) => B) {
  return (fa: Queue<A>): Queue<B> => {
    return new Queue(fa._in.map(f), fa._out.map(f));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableQueue foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (fa: Queue<A>): B => {
    let acc   = b;
    let these = fa;
    while (!these.isEmpty) {
      acc   = f(acc, these.unsafeHead);
      these = these.unsafeTail;
    }
    return acc;
  };
}

/**
 * @tsplus pipeable fncts.ImmutableQueue exists
 */
export function exists<A>(p: Predicate<A>) {
  return (queue: Queue<A>): boolean => {
    return queue._in.exists(p) || queue._out.exists(p);
  };
}

/**
 * @tsplus pipeable fncts.ImmutableQueue find
 */
export function find<A>(p: Predicate<A>) {
  return (queue: Queue<A>): Maybe<A> => {
    let these = queue;
    while (!these.isEmpty) {
      const head = these.unsafeHead;
      if (p(head)) {
        return Just(head);
      }
      these = these.unsafeTail;
    }
    return Nothing();
  };
}

/**
 * @tsplus pipeable fncts.ImmutableQueue filter
 */
export function filter<A>(p: Predicate<A>) {
  return (queue: Queue<A>): Queue<A> => {
    return new Queue(queue._in.filter(p), queue._out.filter(p));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableQueue count
 */
export function count<A>(p: Predicate<A>) {
  return (queue: Queue<A>): number => {
    return queue.foldLeft(0, (b, a) => (p(a) ? b + 1 : b));
  };
}
