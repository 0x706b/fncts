import { ExecutionStrategy } from "../../../../data/ExecutionStrategy.js";
import { Managed } from "../../definition.js";
import { ReleaseMap } from "../definition.js";

/**
 * @tsplus static fncts.control.Managed.ReleaseMapOps makeManagedC
 */
export const makeManagedC: Managed<unknown, never, ReleaseMap> = Managed.concurrency.chain(
  (maybeC) =>
    maybeC.match(
      () => ReleaseMap.makeManaged(ExecutionStrategy.concurrent),
      (n) => ReleaseMap.makeManaged(ExecutionStrategy.concurrentBounded(n)),
    ),
);
