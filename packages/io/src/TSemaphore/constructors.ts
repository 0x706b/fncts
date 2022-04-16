/**
 * @tsplus static fncts.io.TSemaphoreOps __call
 * @tsplus static fncts.io.TSemaphoreOps make
 */
export function make(permits: number): USTM<TSemaphore> {
  return TRef.make(permits).map((ref) => TSemaphore.get(ref));
}

/**
 * @tsplus static fncts.io.TSemaphoreOps unsafeMake
 */
export function unsafeMake(permits: number): TSemaphore {
  return TSemaphore.get(TRef.unsafeMake(permits));
}
