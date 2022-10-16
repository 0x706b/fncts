export const RuntimeConfigFlag = {
  EnableCurrentFiber: Symbol.for("fncta.data.RuntimeConfigFlag.EnableCurrentFiber"),
  LogRuntime: Symbol.for("fncta.data.RuntimeConfigFlag.LogRuntime"),
  SuperviseOperations: Symbol.for("fncta.data.RuntimeConfigFlag.SuperviseOperations"),
  TrackRuntimeMetrics: Symbol.for("fncts.RuntimeConfigFlag.TrackRuntimeMetrics"),
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

/**
 * @tsplus companion fncts.RuntimeConfigFlags
 */
export class RuntimeConfigFlags {
  constructor(readonly flags: HashSet<RuntimeConfigFlag>) {}
  add(flag: RuntimeConfigFlag) {
    return new RuntimeConfigFlags(this.flags.add(flag));
  }
  isEnabled(flag: RuntimeConfigFlag): boolean {
    return this.flags.has(flag);
  }
}

/**
 * @tsplus static fncts.RuntimeConfigFlags empty
 */
export const empty = new RuntimeConfigFlags(HashSet.empty());
