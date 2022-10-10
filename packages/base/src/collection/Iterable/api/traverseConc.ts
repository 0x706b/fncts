import type * as P from "@fncts/base/typeclass";

/**
 * @tsplus getter fncts.Iterable traverseToConcWithIndex
 */
export function _traverseToConcWithIndex<A>(ta: Iterable<A>) {
  return <G extends HKT, GC = HKT.None>(G: P.Applicative<G, GC>) =>
    <K, Q, W, X, I, S, R, E, B>(
      f: (i: number, a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, B>,
    ): HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Conc<B>> => {
      let output     = G.pure<Conc<B>, K, Q, W, X, I, S, R, E>(Conc.empty<B>());
      const iterator = ta[Symbol.iterator]();
      let result: IteratorResult<A>;
      let i          = 0;
      while (!(result = iterator.next()).done) {
        output = output.pipe(G.zipWith(f(i, result.value), (bs, b) => bs.append(b))) as typeof output;
        i++;
      }

      return output;
    };
}

/**
 * @tsplus getter fncts.Iterable traverseToConc
 */
export function _traverseToConc<A>(
  ta: Iterable<A>,
): <G extends HKT, GC = HKT.None>(
  G: P.Applicative<G, GC>,
) => <K, Q, W, X, I, S, R, E, B>(
  f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, B>,
) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Conc<B>> {
  return (G) => (f) => ta.traverseToConcWithIndex(G)((_, a) => f(a));
}
