/**
 * @tsplus pipeable fncts.query.Query mapError
 */
export function mapError<E, E1>(f: (e: E) => E1, __tsplusTrace?: string) {
  return <R, A>(self: Query<R, E, A>): Query<R, E1, A> => {
    return self.bimap(f, Function.identity);
  };
}
