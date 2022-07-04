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
  // constructor(readonly flags: RuntimeFlag) {}
  // add(flag: RuntimeConfigFlag) {
  //   return new RuntimeConfigFlags(this.flags.add(flag));
  // }
  // isEnabled(flag: RuntimeConfigFlag): boolean {
  //   return this.flags.has(flag);
  // }
}

/**
 * @tsplus static fncts.RuntimeConfigFlags empty
 */
export const empty = new RuntimeConfigFlags();
