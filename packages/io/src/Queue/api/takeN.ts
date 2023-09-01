import type { PDequeue } from "@fncts/io/Queue";

/**
 * @tsplus pipeable fncts.io.Queue takeN
 */
export function takeN(n: number, __tsplusTrace?: string) {
  return <RA, RB, EA, EB, A, B>(queue: PDequeue<RA, RB, EA, EB, A, B>): IO<RB, EB, Conc<B>> => {
    return queue.takeBetween(n, n);
  };
}
