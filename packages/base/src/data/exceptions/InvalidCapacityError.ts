export class InvalidCapacityError extends Error {
  readonly _tag = "InvalidCapacityError";

  constructor(message?: string) {
    super(message);
    this.name = this._tag;
  }
}

export function isInvalidCapacityError(u: unknown): u is InvalidCapacityError {
  return u instanceof Error && "_tag" in u && u["_tag"] === "InvalidCapacityError";
}
