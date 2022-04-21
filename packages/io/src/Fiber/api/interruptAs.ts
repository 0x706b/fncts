/**
 * @tsplus fluent fncts.io.Fiber interruptAs
 */
export function interruptAs<E, A>(self: Fiber<E, A>, fiberId: FiberId): UIO<Exit<E, A>> {
  self.concrete();
  return self.interruptAs(fiberId);
}
