export const IllegalArgumentErrorTag = "IllegalArgumentError";

export class IllegalArgumentError extends Error {
  readonly _tag = IllegalArgumentErrorTag;
  constructor(
    message: string,
    readonly methodName: string,
  ) {
    super(message);
    this.name = IllegalArgumentErrorTag;
  }
}
