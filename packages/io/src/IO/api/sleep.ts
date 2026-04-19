/**
 * Suspends execution for the specified duration.
 *
 * @tsplus static fncts.io.IOOps sleep
 */
export function sleep(duration: Lazy<Duration>, __tsplusTrace?: string): UIO<void> {
  return Clock.sleep(duration);
}
