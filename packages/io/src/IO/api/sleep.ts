/**
 * @tsplus static fncts.io.IOOps sleep
 */
export function sleep(duration: Lazy<Duration>, __tsplusTrace?: string): UIO<void> {
  return Clock.sleep(duration);
}
