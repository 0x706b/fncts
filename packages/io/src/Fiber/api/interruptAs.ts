/**
 * @tsplus pipeable fncts.io.Fiber interruptAs
 */
export function interruptAs(fiberId: FiberId, __tsplusTrace?: string) {
  return <E, A>(self: Fiber<E, A>): UIO<Exit<E, A>> => {
    self.concrete();
    return self.interruptAsFork(fiberId) > self.await;
  };
}
