import { Managed } from "../definition.js";

/**
 * @tsplus getter fncts.control.Managed release
 */
export function release<R, E, A>(self: Managed<R, E, A>): Managed<R, E, A> {
  return Managed.fromIO(self.useNow);
}
