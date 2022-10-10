import { Exited, ReleaseMap } from "../definition.js";

/**
 * @tsplus pipeable fncts.io.Scope.ReleaseMap releaseAll
 */
export function releaseAll(exit: Exit<any, any>, execStrategy: ExecutionStrategy, __tsplusTrace?: string) {
  return (releaseMap: ReleaseMap): UIO<any> => {
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
            ).flatMap((exits) =>
              IO.fromExit(
                (execStrategy._tag === "Sequential" ? Exit.collectAll(exits) : Exit.collectAllC(exits)).getOrElse(
                  Exit.succeed(Conc.empty()),
                ),
              ),
            ),
            new Exited(s.nextKey, exit, s.update),
          ];
      }
    }).flatten;
  };
}
