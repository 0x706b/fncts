/**
 * @tsplus fluent fncts.io.Fiber interruptAs
 */
export function interruptAs<E, A>(self: Fiber<E, A>, fiberId: FiberId, __tsplusTrace?: string): UIO<Exit<E, A>> {
  self.concrete();
  return self.interruptAsFork(fiberId) > self.await;
}
