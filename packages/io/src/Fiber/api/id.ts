/**
 * @tsplus getter fncts.io.Fiber id
 */
export function id<E, A>(self: Fiber<E, A>, __tsplusTrace?: string): FiberId {
  self.concrete();
  return self.id;
}
