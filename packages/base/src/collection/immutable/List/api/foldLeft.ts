import type { List } from "../definition.js";

/**
 * @tsplus fluent fncts.List foldLeft
 */
export function foldLeft_<A, B>(self: List<A>, b: B, f: (b: B, a: A) => B): B {
  let acc   = b;
  let these = self;
  while (!these.isEmpty()) {
    acc   = f(acc, these.head);
    these = these.tail;
  }
  return acc;
}
