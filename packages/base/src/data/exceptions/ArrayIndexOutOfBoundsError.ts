export const ArrayIndexOutOfBoundsErrorTag = "ArrayIndexOutOfBoundsException";

export class ArrayIndexOutOfBoundsError extends Error {
  readonly _tag = ArrayIndexOutOfBoundsErrorTag;
  constructor(message: string) {
    super(message);
    this.name = ArrayIndexOutOfBoundsErrorTag;
  }
}
