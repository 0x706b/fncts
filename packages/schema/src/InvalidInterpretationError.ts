export const InvalidInterpretationErrorTypeId = Symbol.for("fncts.schema.InvalidInterpretationError");
export type InvalidInterpretationErrorTypeId = typeof InvalidInterpretationErrorTypeId;

export class InvalidInterpretationError extends Error {
  readonly [InvalidInterpretationErrorTypeId]: InvalidInterpretationErrorTypeId = InvalidInterpretationErrorTypeId;
}
