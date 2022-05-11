import type * as P from "@fncts/base/typeclass";

/**
 * @tsplus fluent fncts.Iterable traverseToConcWithIndex
 */
export function traverseToConcWithIndex_<G extends HKT, K, Q, W, X, I, S, R, E, A, B>(
  ta: Iterable<A>,
  f: (i: number, a: A) => HKT.Kind<G, K, Q, W, X, I, S, R, E, B>,
  /** @tsplus auto */ G: P.Applicative<G>,
): HKT.Kind<G, K, Q, W, X, I, S, R, E, Conc<B>> {
  let output     = G.pure<Conc<B>, K, Q, W, X, I, S, R, E>(Conc.empty<B>());
  const iterator = ta[Symbol.iterator]();
  let result: IteratorResult<A>;
  let i          = 0;
  while (!(result = iterator.next()).done) {
    output = G.zipWith(output, f(i, result.value), (bs, b) => bs.append(b));
    i++;
  }

  return output;
}

/**
 * @tsplus fluent fncts.Iterable traverseToConc
 */
export function traverseToConc_<G extends HKT, K, Q, W, X, I, S, R, E, A, B>(
  ta: Iterable<A>,
  f: (a: A) => HKT.Kind<G, K, Q, W, X, I, S, R, E, B>,
  /** @tsplus auto */ G: P.Applicative<G>,
): HKT.Kind<G, K, Q, W, X, I, S, R, E, Conc<B>> {
  return ta.traverseToConcWithIndex((_, a) => f(a), G);
}
