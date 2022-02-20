import { STM } from "./definition";

/**
 * Applies the function `f` to each element of the `Iterable<A>` and
 * returns a transactional effect that produces a new `ReadonlyArray<B>`.
 *
 * @tsplus static fncts.control.STMOps foreach
 */
export function foreach_<A, R, E, B>(
  it: Iterable<A>,
  f: (a: A) => STM<R, E, B>
): STM<R, E, readonly B[]> {
  return STM.defer(() => {
    let stm = STM.succeedNow([]) as STM<R, E, B[]>;

    for (const a of it) {
      stm = stm.zipWith(f(a), (acc, b) => {
        acc.push(b);
        return acc;
      });
    }

    return stm;
  });
}

/**
 * Sequentially zips this value with the specified one, combining the values
 * using the specified combiner function.
 *
 * @tsplus fluent fncts.control.STM zipWith
 */
export function zipWith_<R, E, A, R1, E1, B, C>(
  self: STM<R, E, A>,
  that: STM<R1, E1, B>,
  f: (a: A, b: B) => C
): STM<R & R1, E | E1, C> {
  return self.chain((a) => that.map((b) => f(a, b)));
}
