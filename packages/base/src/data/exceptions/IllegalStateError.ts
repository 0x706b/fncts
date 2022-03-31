export const IllegalStateErrorTag = "IllegalStateError";

export class IllegalStateError extends Error {
  readonly _tag = IllegalStateErrorTag;
  constructor(message: string) {
    super(message);
    this.name = IllegalStateErrorTag;
  }
}
