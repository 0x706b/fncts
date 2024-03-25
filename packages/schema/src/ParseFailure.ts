export const ParseFailureTypeId = Symbol.for("fncts.schema.ParseFailure");
export type ParseFailureTypeId = typeof ParseFailureTypeId;

/**
 * @tsplus type fncts.schema.ParseFailure
 * @tsplus companion fncts.schema.ParseFailureOps
 */
export class ParseFailure {
  readonly [ParseFailureTypeId]: ParseFailureTypeId = ParseFailureTypeId;
  constructor(readonly errors: Vector<ParseError>) {}
}

/**
 * @tsplus static fncts.schema.ParseFailureOps __call
 */
export function make(errors: Vector<ParseError>): ParseFailure {
  return new ParseFailure(errors);
}
