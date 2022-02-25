import type { Managed } from "../definition";

import { IO } from "../../IO";

/**
 * @tsplus getter fncts.control.Managed useNow
 */
export function useNow<R, E, A>(self: Managed<R, E, A>): IO<R, E, A> {
  return self.use(IO.succeedNow);
}
