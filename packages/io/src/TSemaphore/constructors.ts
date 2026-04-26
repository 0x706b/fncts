/**
 * Creates a transactional semaphore initialized with `permits` permits.
 *
 * @tsplus static fncts.io.TSemaphoreOps __call
 *
 * @tsplus static fncts.io.TSemaphoreOps make
 */
export function make(permits: number, __tsplusTrace?: string): USTM<TSemaphore> {
  return TRef.make(permits).map((ref) => TSemaphore.get(ref));
}

/**
 * Creates a semaphore in `UIO` by committing `TSemaphore.make`.
 *
 * @tsplus static fncts.io.TSemaphoreOps makeCommit
 */
export function makeCommit(permits: number, __tsplusTrace?: string): UIO<TSemaphore> {
  return TSemaphore(permits).commit;
}

/**
 * Unsafely creates a semaphore outside STM transactions.
 *
 * @tsplus static fncts.io.TSemaphoreOps unsafeMake
 */
export function unsafeMake(permits: number): TSemaphore {
  return TSemaphore.get(TRef.unsafeMake(permits));
}
