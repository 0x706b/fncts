import type { ParseOptions } from "../AST.js";

import { parserFor } from "./interpreter.js";

/**
 * @tsplus getter fncts.schema.Schema decode
 * @tsplus getter fncts.schema.Parser decode
 */
export function decode<A>(schema: Schema<A>): Parser<A> {
  return parserFor(schema.ast);
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
  return parserFor(schema.ast.reverse);
}

/**
 * @tsplus getter fncts.schema.Schema encodeMaybe
 * @tsplus getter fncts.schema.Parser encodeMaybe
 */
export function encodeMaybe<A>(schema: Schema<A>): <A>(input: A, options?: ParseOptions) => Maybe<unknown> {
  return parseMaybe(schema.ast.reverse);
}

/**
 * @tsplus getter fncts.schema.Schema is
 * @tsplus getter fncts.schema.Parser is
 */
export function is<A>(schema: Schema<A>) {
  return (input: unknown, options?: ParseOptions): input is A => {
    return parserFor(schema.ast)(input, options).isRight();
  };
}

function parseMaybe(ast: AST) {
  const parse = parserFor(ast);
  return (input: unknown, options?: ParseOptions): Maybe<any> => {
    return parse(input, options).toMaybe;
  };
}

function parseOrThrow(ast: AST) {
  const parser = parserFor(ast);
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
