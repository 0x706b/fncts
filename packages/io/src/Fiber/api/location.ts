/**
 * @tsplus getter fncts.io.Fiber location
 */
export function location<E, A>(self: Fiber<E, A>): TraceElement {
  self.concrete();
  return self._tag === "RuntimeFiber" ? self.location : TraceElement.NoLocation;
}
