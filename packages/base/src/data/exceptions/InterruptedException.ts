import { hasTypeId } from "../../util/predicates.js";

export const InterruptedExceptionTypeId = Symbol.for("fncts.InterruptedException");
export type InterruptedExceptionTypeId = typeof InterruptedExceptionTypeId;

export class InterruptedException {
  readonly _typeId: InterruptedExceptionTypeId = InterruptedExceptionTypeId;
  constructor(readonly message?: string) {}
}

export function isInterruptedException(u: unknown): u is InterruptedException {
  return hasTypeId(u, InterruptedExceptionTypeId);
}
