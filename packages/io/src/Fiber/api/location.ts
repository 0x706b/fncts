/**
 * @tsplus getter fncts.io.Fiber location
 */
export function location<E, A>(self: Fiber<E, A>): string | undefined {
  self.concrete();
  return self._tag === "RuntimeFiber" ? self.location : undefined;
}
