/**
 * @tsplus getter fncts.io.Fiber poll
 */
export function poll<E, A>(self: Fiber<E, A>, __tsplusTrace?: string): UIO<Maybe<Exit<E, A>>> {
  self.concrete();
  return self.poll;
}
