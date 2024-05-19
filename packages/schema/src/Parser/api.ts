import type { ParseOptions } from "../AST.js";

import { parserFor } from "./interpreter.js";

/**
 * @tsplus getter fncts.schema.Schema decode
 * @tsplus getter fncts.schema.Parser decode
 */
export function decode<A>(schema: Schema<A>): Parser<A> {
  return parserFor(schema.ast, true);
}

/**
 * @tsplus getter fncts.schema.Schema decodeMaybe
 * @tsplus getter fncts.schema.Parser decodeMaybe
 */
export function decodeMaybe<A>(schema: Schema<A>): <A>(input: A, options?: ParseOptions) => Maybe<A> {
  return parseMaybe(schema.ast.getTo);
}

/**
 * @tsplus getter fncts.schema.Schema encode
 * @tsplus getter fncts.schema.Parser encode
 */
export function encode<A>(schema: Schema<A>): <A>(input: A, options?: ParseOptions) => ParseResult<unknown> {
  return parserFor(schema.ast, false);
}

/**
 * @tsplus getter fncts.schema.Schema encodeMaybe
 * @tsplus getter fncts.schema.Parser encodeMaybe
 */
export function encodeMaybe<A>(schema: Schema<A>): <A>(input: A, options?: ParseOptions) => Maybe<unknown> {
  return (input, options) => encode(schema)(input, options).toMaybe;
}

function parseMaybe(ast: AST) {
  const parse = parserFor(ast, true);
  return (input: unknown, options?: ParseOptions): Maybe<any> => {
    return parse(input, options).toMaybe;
  };
}

function parseOrThrow(ast: AST) {
  const parser = parserFor(ast, true);
  return (input: unknown, options?: ParseOptions) => {
    return parser(input, options).match((failure) => {
      throw new Error(ParseError.format(failure.errors));
    }, Function.identity);
  };
}

/**
 * @tsplus getter fncts.schema.Schema asserts
 * @tsplus getter fncts.schema.Parser asserts
 */
export function asserts<A>(schema: Schema<A>) {
  return (input: unknown, options?: ParseOptions): asserts input is A => {
    parseOrThrow(schema.ast.getTo)(input, options);
  };
}
