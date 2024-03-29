import { SyntheticFiber } from "@fncts/io/Fiber/definition";

/**
 * Zips this fiber with the specified fiber, combining their results using
 * the specified combiner function. Both joins and interruptions are performed
 * in sequential order from left to right.
 *
 * @tsplus pipeable fncts.io.Fiber zipWith
 */
export function zipWith<A, E1, B, C>(that: Fiber<E1, B>, f: (a: A, b: B) => C, __tsplusTrace?: string) {
  return <E>(self: Fiber<E, A>): Fiber<E | E1, C> => {
    return new SyntheticFiber(
      self.id,
      self.await.flatMap(IO.fromExitNow).zipWithConcurrent(that.await.flatMap(IO.fromExitNow), f).result,
      self.children,
      that.inheritRefs > self.inheritRefs,
      self.poll.zipWith(that.poll, (ma, mb) =>
        ma.isJust() && mb.isJust() ? Just(ma.value.zipWithCause(mb.value, f, Cause.sequential)) : Nothing(),
      ),
      (id) => self.interruptAs(id).zipWith(that.interruptAs(id), (ea, eb) => ea.zipWithCause(eb, f, Cause.sequential)),
    );
  };
}
