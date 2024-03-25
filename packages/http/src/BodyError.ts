export const BodyErrorTypeId = Symbol.for("fncts.http.BodyError");
export type BodyErrorTypeId = typeof BodyErrorTypeId;

export const enum BodyErrorTag {
  JsonError,
  SchemaError,
}

/**
 * @tsplus type fncts.http.BodyError
 * @tsplus concrete fncts.http.BodyErrorOps
 */
export abstract class BodyError {
  readonly [BodyErrorTypeId]: BodyErrorTypeId = BodyErrorTypeId;
}

export class JsonError extends BodyError {
  readonly _tag = BodyErrorTag.JsonError;
  constructor(readonly error: unknown) {
    super();
  }
}

export class SchemaError extends BodyError {
  readonly _tag = BodyErrorTag.SchemaError;
  constructor(readonly error: ParseFailure) {
    super();
  }
}

export type Concrete = JsonError | SchemaError;

/**
 * @tsplus fluent fncts.http.BodyError concrete
 */
export function concrete(self: BodyError): asserts self is Concrete {
  //
}
