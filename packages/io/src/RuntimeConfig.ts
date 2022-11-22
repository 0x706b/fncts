export class RuntimeConfig extends CaseClass<{
  readonly reportFailure: (e: Cause<unknown>) => void;
  readonly supervisor: Supervisor<any>;
  readonly yieldOpCount: number;
  readonly logger: Logger<string, any>;
}> {}
