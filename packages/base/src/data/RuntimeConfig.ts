import type { Logger } from "../control/Logger";
import type { Supervisor } from "../control/Supervisor";
import type { Cause } from "./Cause";
import type { FiberId } from "./FiberId";

import { HashSet } from "../collection/immutable/HashSet";
import { CaseClass } from "./CaseClass";

export const RuntimeConfigFlag = {
  EnableCurrentFiber: Symbol.for("fncta.data.RuntimeConfigFlag.EnableCurrentFiber"),
  LogRuntime: Symbol.for("fncta.data.RuntimeConfigFlag.LogRuntime"),
  SuperviseOperations: Symbol.for("fncta.data.RuntimeConfigFlag.SuperviseOperations"),
  TrackRuntimeMetrics: Symbol.for("fncts.data.RuntimeConfigFlag.TrackRuntimeMetrics"),
  EnableFiberRoots: Symbol.for("fncta.data.RuntimeConfigFlag.EnableFiberRoots"),
} as const;

export type RuntimeConfigFlag = typeof RuntimeConfigFlag[keyof typeof RuntimeConfigFlag];

export class RuntimeConfig extends CaseClass<{
  readonly reportFailure: (e: Cause<unknown>) => void;
  readonly supervisor: Supervisor<any>;
  readonly flags: RuntimeConfigFlags;
  readonly yieldOpCount: number;
  readonly logger: Logger<string, any>;
}> {}

export class RuntimeConfigFlags {
  constructor(readonly flags: HashSet<RuntimeConfigFlag>) {}

  static empty = new RuntimeConfigFlags(HashSet.makeDefault());

  add(flag: RuntimeConfigFlag) {
    return new RuntimeConfigFlags(this.flags.add(flag));
  }

  isEnabled(flag: RuntimeConfigFlag): boolean {
    return this.flags.has(flag);
  }
}
