/**
 * @tsplus type fncts.schema.ParseResult
 * @tsplus companion fncts.schema.ParseResultOps
 */
export interface ParseResult<A> extends Either<ParseError, A> {}

/**
 * @tsplus static fncts.schema.ParseResultOps succeed
 */
export function succeed<A>(value: A): ParseResult<A> {
  return Either.right(value);
}

/**
 * @tsplus static fncts.schema.ParseResultOps fail
 */
export function fail<A = never>(value: ParseError): ParseResult<A> {
  return Either.left(value);
}
