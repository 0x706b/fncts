import { zipChunks } from "../internal/util.js";

/**
 * @tsplus pipeable fncts.io.Stream zipWith
 */
export function zipWith<A, R1, E1, B, C>(that: Stream<R1, E1, B>, f: (a: A, b: B) => C, __tsplusTrace?: string) {
  return <R, E>(self: Stream<R, E, A>): Stream<R | R1, E | E1, C> => {
    return self.zipWithChunks(that, (as, bs) => zipChunks(as, bs, f));
  };
}
