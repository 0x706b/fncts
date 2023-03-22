import type { ParseOptions } from "../AST.js";

/**
 * @tsplus type fncts.schema.Parser
 * @tsplus companion fncts.schema.ParserOps
 * @tsplus no-inherit fncts.schema.Schema fncts.schema.SchemaOps
 */
export interface Parser<in out A> {
  (input: unknown, options?: ParseOptions): ParseResult<A>;
}

/**
 * @tsplus static fncts.schema.ParserOps make
 */
export function make<A>(parse: Parser<A>): Parser<A> {
  return parse;
}

/**
 * @tsplus static fncts.schema.ParserOps fromRefinement
 */
export function fromRefinement<A>(ast: AST, refinement: Refinement<unknown, A>): Parser<A> {
  return (u) => (refinement(u) ? ParseResult.succeed(u) : ParseResult.fail(ParseError.TypeError(ast, u)));
}
