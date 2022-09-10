/**
 * @tsplus fluent fncts.io.Fiber interruptAsFork
 */
export function interruptAsFork<E, A>(self: Fiber<E, A>, fiberId: FiberId): UIO<void> {
  self.concrete();
  return self.interruptAsFork(fiberId);
}
