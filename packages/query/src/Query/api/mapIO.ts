/**
 * @tsplus pipeable fncts.query.Query mapIO
 */
export function mapIO<A, R1, E1, B>(f: (a: A) => IO<R1, E1, B>) {
  return <R, E>(self: Query<R, E, A>): Query<R | R1, E | E1, B> => {
    return self.flatMap(a => Query.fromIO(f(a)))
  }
}