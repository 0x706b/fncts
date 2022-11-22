/**
 * @tsplus fluent fncts.io.Fiber interruptAsFork
 */
export function interruptAsFork<E, A>(self: Fiber<E, A>, fiberId: FiberId): UIO<void> {
  self.concrete();
  return self.interruptAsFork(fiberId);
}

/**
 * @tsplus fluent fncts.io.Fiber interruptAs
 */
export function interruptAs<E, A>(self: Fiber<E, A>, fiberId: FiberId): UIO<Exit<E, A>> {
  return self.interruptAsFork(fiberId) > self.await;
}
