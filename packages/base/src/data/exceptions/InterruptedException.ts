export const InterruptedExceptionTypeId = Symbol.for("fncts.InterruptedException");
export type InterruptedExceptionTypeId = typeof InterruptedExceptionTypeId;

export class InterruptedException {
  readonly [InterruptedExceptionTypeId]: InterruptedExceptionTypeId = InterruptedExceptionTypeId;
  constructor(readonly message?: string) {}
}

export function isInterruptedException(u: unknown): u is InterruptedException {
  return isObject(u) && InterruptedExceptionTypeId in u;
}
