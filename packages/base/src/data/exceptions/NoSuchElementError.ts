export const NoSuchElementErrorTag = "NoSuchElementError";

export class NoSuchElementError extends Error {
  readonly _tag = NoSuchElementErrorTag;
  constructor(message?: string) {
    super(message);
    this.name = NoSuchElementErrorTag;
  }
}
