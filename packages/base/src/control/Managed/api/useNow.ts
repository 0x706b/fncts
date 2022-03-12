import type { Managed } from "../definition.js";

import { IO } from "../../IO.js";

/**
 * @tsplus getter fncts.control.Managed useNow
 */
export function useNow<R, E, A>(self: Managed<R, E, A>): IO<R, E, A> {
  return self.use(IO.succeedNow);
}
