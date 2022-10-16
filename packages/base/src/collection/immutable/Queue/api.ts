import { Queue } from "@fncts/base/collection/immutable/Queue/definition";

/**
 * @tsplus getter fncts.ImmutableQueue length
 */
export function length<A>(self: Queue<A>): number {
  return self._in.length + self._out.length;
}

/**
 * @tsplus getter fncts.ImmutableQueue unsafeHead
 */
export function unsafeHead<A>(self: Queue<A>): A {
  if (self._out.isNonEmpty()) {
    return self._out.unsafeHead;
  } else if (self._in.isNonEmpty()) {
    return self._in.unsafeLast;
  } else {
    throw new NoSuchElementError("unsafeHead on empty Queue");
  }
}

/**
 * @tsplus getter fncts.ImmutableQueue head
 */
export function head<A>(self: Queue<A>): Maybe<A> {
  return self.isEmpty ? Nothing() : Just(self.unsafeHead);
}

/**
 * @tsplus getter fncts.ImmutableQueue unsafeTail
 */
export function unsafeTail<A>(self: Queue<A>): Queue<A> {
  if (self._out.isNonEmpty()) {
    return new Queue(self._in, self._out.tail);
  } else if (self._in.isNonEmpty()) {
    return new Queue(List.empty(), self._in.reverse.unsafeTail);
  } else {
    throw new NoSuchElementError("tail on empty Queue");
  }
}

/**
 * @tsplus getter fncts.ImmutableQueue tail
 */
export function tail<A>(self: Queue<A>): Maybe<Queue<A>> {
  return self.isEmpty ? Nothing() : Just(self.unsafeTail);
}

/**
 * @tsplus pipeable fncts.ImmutableQueue prepend
 */
export function prepend<B>(elem: B) {
  return <A>(self: Queue<A>): Queue<A | B> => {
    return new Queue(self._in, self._out.prepend(elem));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableQueue enqueue
 */
export function enqueue<B>(elem: B) {
  return <A>(self: Queue<A>): Queue<A | B> => {
    return new Queue(self._in.prepend(elem), self._out);
  };
}

/**
 * @tsplus getter fncts.ImmutableQueue unsafeDequeue
 */
export function unasfeDequeue<A>(self: Queue<A>): readonly [A, Queue<A>] {
  if (self._out.isEmpty() && self._in.isNonEmpty()) {
    const rev = self._in.reverse;
    return [rev.unsafeHead, new Queue(Nil(), rev.unsafeTail)];
  } else if (self._out.isNonEmpty()) {
    return [self._out.unsafeHead, new Queue(self._in, self._out.unsafeTail)];
  } else {
    throw new NoSuchElementError("unsafeDequeue on empty Queue");
  }
}

/**
 * @tsplus getter fncts.ImmutableQueue dequeue
 */
export function dequeue<A>(self: Queue<A>): Maybe<readonly [A, Queue<A>]> {
  if (self.isEmpty) {
    return Nothing();
  }
  return Just(self.unsafeDequeue);
}

/**
 * @tsplus pipeable fncts.ImmutableQueue map
 */
export function map<A, B>(f: (a: A) => B) {
  return (self: Queue<A>): Queue<B> => {
    return new Queue(self._in.map(f), self._out.map(f));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableQueue foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: Queue<A>): B => {
    let acc   = b;
    let these = self;
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
  return (self: Queue<A>): boolean => {
    return self._in.exists(p) || self._out.exists(p);
  };
}

/**
 * @tsplus pipeable fncts.ImmutableQueue find
 */
export function find<A>(p: Predicate<A>) {
  return (self: Queue<A>): Maybe<A> => {
    let these = self;
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
  return (self: Queue<A>): Queue<A> => {
    return new Queue(self._in.filter(p), self._out.filter(p));
  };
}

/**
 * @tsplus pipeable fncts.ImmutableQueue count
 */
export function count<A>(p: Predicate<A>) {
  return (self: Queue<A>): number => {
    return self.foldLeft(0, (b, a) => (p(a) ? b + 1 : b));
  };
}
