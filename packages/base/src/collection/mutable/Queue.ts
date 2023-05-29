import { ArrayDeque } from "@fncts/base/collection/mutable/ArrayDeque";

/**
 * @tsplus type fncts.MutableQueue
 * @tsplus companion fncts.MutableQueue
 */
export class Queue<A> extends ArrayDeque<A> {
  enqueue(elem: A): this {
    return this.addOne(elem);
  }
  dequeue(): A {
    return this.removeHead();
  }
}
