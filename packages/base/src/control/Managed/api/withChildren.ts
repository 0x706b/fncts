import type { Conc } from "../../../collection/immutable/Conc";
import type { Fiber } from "../../Fiber";
import type { UIO } from "../../IO";

import { IO } from "../../IO";
import { Supervisor } from "../../Supervisor";
import { Managed } from "../definition";

/**
 * Locally installs a supervisor and an effect that succeeds with all the
 * children that have been forked in the returned effect.
 *
 * @tsplus static fncts.control.ManagedOps withChildren
 */
export function withChildren<R, E, A>(
  get: (_: UIO<Conc<Fiber.Runtime<any, any>>>) => Managed<R, E, A>,
): Managed<R, E, A> {
  return Managed.unwrap(
    Supervisor.track.map(
      (supervisor) =>
        new Managed(
          get(
            supervisor.value.chain((children) =>
              IO.descriptor.map((d) => children.filter((f) => f.id !== d.id)),
            ),
          ).io.supervised(supervisor),
        ),
    ),
  );
}
