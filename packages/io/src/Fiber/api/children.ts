/**
 * @tsplus getter fncts.io.Fiber children
 */
export function children<E, A>(self: Fiber<E, A>, __tsplusTrace?: string): UIO<Conc<Fiber.Runtime<any, any>>> {
  self.concrete();
  return self.children;
}
