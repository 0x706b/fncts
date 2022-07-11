/**
 * @tsplus fluent fncts.callbag.Source flatMap
 */
export function flatMap<E, A, E1, B>(self: Source<E, A>, f: (a: A) => Source<E1, B>): Source<E | E1, B> {
  return self.map(f).flatten;
}
