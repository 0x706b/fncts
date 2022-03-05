import type * as P from "../../../../prelude";
import type { HKT } from "../../../../prelude";

import { Conc } from "../../Conc";

/**
 * @tsplus getter fncts.collection.immutable.Iterable traverseToConcWithIndex
 */
export function traverseToConcWithIndex_<A>(
  ta: Iterable<A>,
): <G extends HKT, CG>(
  G: P.Applicative<G, CG>,
) => <K, Q, W, X, I, S, R, E, B>(
  f: (i: number, a: A) => HKT.Kind<G, CG, K, Q, W, X, I, S, R, E, B>,
) => HKT.Kind<G, CG, K, Q, W, X, I, S, R, E, Conc<B>>;
export function traverseToConcWithIndex_<A>(ta: Iterable<A>) {
  return <G>(G: P.Applicative<HKT.F<G>>) =>
    <K, Q, W, X, I, S, R, E, B>(
      f: (i: number, a: A) => HKT.FK<G, K, Q, W, X, I, S, R, E, B>,
    ): HKT.FK<G, K, Q, W, X, I, S, R, E, Conc<B>> => {
      let output     = G.pure(Conc.empty<B>());
      const iterator = ta[Symbol.iterator]();
      let result: IteratorResult<A>;
      let i          = 0;
      while (!(result = iterator.next()).done) {
        output = G.zipWith_(output, f(i, result.value), (bs, b) => bs.append(b));
        i++;
      }

      return output;
    };
}

/**
 * @tsplus getter fncts.collection.immutable.Iterable traverseToConc
 */
export function traverseToConc_<A>(ta: Iterable<A>) {
  return <G extends HKT, GC>(G: P.Applicative<G, GC>) =>
    <K, Q, W, X, I, S, R, E, B>(
      f: (a: A) => HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, B>,
    ): HKT.Kind<G, GC, K, Q, W, X, I, S, R, E, Conc<B>> =>
      ta.traverseToConcWithIndex(G)((_, a) => f(a));
}
