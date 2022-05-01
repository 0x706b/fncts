/**
 * @tsplus getter fncts.io.Fiber id
 */
export function id<E, A>(self: Fiber<E, A>): FiberId {
  self.concrete();
  return self.id;
}
