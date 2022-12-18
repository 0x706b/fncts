/**
 * @tsplus static fncts.query.QueryOps foreach
 */
export function foreach<A, R, E, B>(
  as: Iterable<A>,
  f: (a: A) => Query<R, E, B>,
  __tsplusTrace?: string,
): Query<R, E, Conc<B>> {
  const out: Array<B>            = [];
  let builder: Query<R, E, void> = Query.unit;
  for (const a of as) {
    builder = builder.zipWith(f(a), (_, b) => {
      out.push(b);
    });
  }
  return builder.map(() => Conc.fromArray(out));
}
