export const IndexOutOfBoundsErrorTag = "IndexOutOfBoundsError";

export class IndexOutOfBoundsError extends Error {
  readonly _tag = IndexOutOfBoundsErrorTag;
  constructor(message: string) {
    super(message);
    this.name = IndexOutOfBoundsErrorTag;
  }
}
