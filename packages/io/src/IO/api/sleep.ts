/**
 * @tsplus static fncts.io.IOOps sleep
 */
export function sleep(duration: number, __tsplusTrace?: string): UIO<void> {
  return Clock.sleep(duration);
}