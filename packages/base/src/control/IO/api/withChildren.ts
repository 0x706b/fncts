import type { Conc } from "../../../collection/immutable/Conc.js";
import type { Fiber } from "../../Fiber.js";
import type { UIO } from "../definition.js";

import { Supervisor } from "../../Supervisor.js";
import { IO } from "../definition.js";

/**
 * @tsplus static fncts.control.IOOps withChildren
 */
export function withChildren<R, E, A>(
  get: (_: UIO<Conc<Fiber.Runtime<any, any>>>) => IO<R, E, A>,
  __tsplusTrace?: string,
): IO<R, E, A> {
  return Supervisor.track.chain((supervisor) =>
    get(
      supervisor.value.chain((children) =>
        IO.descriptor.map((d) => children.filter((_) => _.id != d.id)),
      ),
    ).supervised(supervisor),
  );
}
