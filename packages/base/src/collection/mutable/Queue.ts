import { ArrayDeque } from "@fncts/base/collection/mutable/ArrayDeque";

/**
 * A mutable FIFO queue backed by an `ArrayDeque`.
 *
 * @tsplus type fncts.MutableQueue
 *
 * @tsplus companion fncts.MutableQueue
 */
export class Queue<A> extends ArrayDeque<A> {
  /**
   * Appends an element to the end of the queue.
   */
  enqueue(elem: A): this {
    return this.addOne(elem);
  }

  /**
   * Removes and returns the element at the front of the queue.
   */
  dequeue(): A {
    return this.removeHead();
  }
}
