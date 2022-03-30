import type { ExecutionStrategy } from "../../../../data/ExecutionStrategy.js";
import type { UIO } from "../../../IO.js";

import { Conc } from "../../../../collection/immutable/Conc.js";
import { Exit } from "../../../../data/Exit.js";
import { IO } from "../../../IO.js";
import { Finalizer } from "../../Finalizer.js";
import { Exited, ReleaseMap } from "../definition.js";

/**
 * @tsplus fluent fncts.control.Scope.ReleaseMap releaseAll
 */
export function releaseAll_(
  releaseMap: ReleaseMap,
  exit: Exit<any, any>,
  execStrategy: ExecutionStrategy,
): UIO<any> {
  return ReleaseMap.reverseGet(releaseMap).modify((s) => {
    switch (s._tag) {
      case "Exited":
        return [IO.unit, s];
      case "Running":
        return [
          IO.foreachExec(
            Array.from(s.finalizers).reverse(),
            execStrategy,
            ([_, f]) => Finalizer.reverseGet(s.update(f))(exit).result,
          ).chain((exits) =>
            IO.fromExit(
              (execStrategy._tag === "Sequential"
                ? Exit.collectAll(exits)
                : Exit.collectAllC(exits)
              ).getOrElse(Exit.succeed(Conc.empty())),
            ),
          ),
          new Exited(s.nextKey, exit, s.update),
        ];
    }
  }).flatten;
}
