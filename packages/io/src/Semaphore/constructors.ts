/**
 * @tsplus static fncts.io.SemaphoreOps unsafeMake
 */
export function unsafeMakeSemaphore(permits: number): Semaphore {
  return new Semaphore(permits);
}

/**
 * @tsplus static fncts.io.SemaphoreOps make
 * @tsplus static fncts.io.SemaphoreOps __call
 */
export function makeSemaphore(permits: number, __tsplusTrace?: string): UIO<Semaphore> {
  return IO(Semaphore.unsafeMake(permits));
}
