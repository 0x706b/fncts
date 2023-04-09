export const IOErrorTypeId = Symbol.for("fncts.base.exceptions.IOError");
export type IOErrorTypeId = typeof IOErrorTypeId;

export class IOError<E> {
  readonly [IOErrorTypeId]: IOErrorTypeId = IOErrorTypeId;
  constructor(readonly cause: Cause<E>) {}
}

export function isIOError(u: unknown): u is IOError<unknown> {
  return isObject(u) && IOErrorTypeId in u;
}
