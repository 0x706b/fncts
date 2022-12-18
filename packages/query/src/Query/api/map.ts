/**
 * @tsplus pipeable fncts.query.Query map
 */
export function map<A, B>(f: (a: A) => B) {
  return <R, E>(self: Query<R, E, A>): Query<R, E, B> => {
    return new Query(self.step.map((result) => result.map(f)));
  };
}
