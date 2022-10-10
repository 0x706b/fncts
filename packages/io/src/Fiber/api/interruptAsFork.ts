/**
 * @tsplus pipeable fncts.io.Fiber interruptAsFork
 */
export function interruptAsFork(fiberId: FiberId) {
  return <E, A>(self: Fiber<E, A>): UIO<void> => {
    self.concrete();
    return self.interruptAsFork(fiberId);
  };
}
