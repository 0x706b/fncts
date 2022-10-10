/**
 * @tsplus pipeable fncts.List foldLeft
 */
export function foldLeft<A, B>(b: B, f: (b: B, a: A) => B) {
  return (self: List<A>): B => {
    let acc   = b;
    let these = self;
    while (!these.isEmpty()) {
      acc   = f(acc, these.head);
      these = these.tail;
    }
    return acc;
  };
}
