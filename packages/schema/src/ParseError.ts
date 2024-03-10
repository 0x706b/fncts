import type { TemplateLiteral, TemplateLiteralSpan, Validation } from "@fncts/schema/AST";

import { showWithOptions } from "@fncts/base/data/Showable";
import { concrete } from "@fncts/schema/AST";
import { ASTTag } from "@fncts/schema/AST";
import { ASTAnnotation } from "@fncts/schema/ASTAnnotation";

export const enum ParseErrorTag {
  Type,
  Index,
  Key,
  Missing,
  Unexpected,
  UnionMember,
}

/**
 * @tsplus type fncts.schema.ParseError
 * @tsplus companion fncts.schema.ParseErrorOps
 */
export type ParseError =
  | TypeError
  | IndexError
  | KeyError
  | MissingError
  | UnexpectedError
  | UnexpectedError
  | UnionMemberError;

/**
 * @tsplus companion fncts.schema.ParseError.TypeError
 */
export class TypeError {
  readonly _tag = ParseErrorTag.Type;
  constructor(
    readonly expected: AST,
    readonly actual: unknown,
  ) {}
}

/**
 * @tsplus static fncts.schema.ParseError.TypeError __call
 * @tsplus static fncts.schema.ParseErrorOps TypeError
 */
export function typeError(expected: AST, actual: unknown): ParseError {
  return new TypeError(expected, actual);
}

/**
 * @tsplus companion fncts.schema.ParseError.IndexError
 */
export class IndexError {
  readonly _tag = ParseErrorTag.Index;
  constructor(
    readonly index: number,
    readonly errors: Vector<ParseError>,
  ) {}
}

/**
 * @tsplus static fncts.schema.ParseError.IndexError __call
 * @tsplus static fncts.schema.ParseErrorOps IndexError
 */
export function indexError(index: number, errors: Vector<ParseError>): ParseError {
  return new IndexError(index, errors);
}

/**
 * @tsplus companion fncts.schema.ParseError.KeyError
 */
export class KeyError {
  readonly _tag = ParseErrorTag.Key;
  constructor(
    readonly keyAST: AST,
    readonly key: any,
    readonly errors: Vector<ParseError>,
  ) {}
}

/**
 * @tsplus static fncts.schema.ParseError.IndexError __call
 * @tsplus static fncts.schema.ParseErrorOps KeyError
 */
export function keyError(keyAST: AST, key: any, errors: Vector<ParseError>): ParseError {
  return new KeyError(keyAST, key, errors);
}

/**
 * @tsplus companion fncts.schema.ParseError.MissingError
 */
export class MissingError {
  readonly _tag = ParseErrorTag.Missing;
}

/**
 * @tsplus static fncts.schema.ParseErrorOps MissingError
 */
export const missingError = new MissingError();

/**
 * @tsplus companion fncts.schema.ParseError.UnexpectedError
 */
export class UnexpectedError {
  readonly _tag = ParseErrorTag.Unexpected;
  constructor(readonly actual: unknown) {}
}

/**
 * @tsplus static fncts.schema.ParseError.UnexpectedError __call
 * @tsplus static fncts.schema.ParseErrorOps UnexpectedError
 */
export function unexpectedError(actual: unknown): ParseError {
  return new UnexpectedError(actual);
}

/**
 * @tsplus companion fncts.schema.ParseError.UnionMemberError
 */
export class UnionMemberError {
  readonly _tag = ParseErrorTag.UnionMember;
  constructor(readonly errors: Vector<ParseError>) {}
}

/**
 * @tsplus static fncts.schema.ParseError.UnionMemberError __call
 * @tsplus static fncts.schema.ParseErrorOps UnionMemberError
 */
export function unionMemberError(errors: Vector<ParseError>): ParseError {
  return new UnionMemberError(errors);
}

/**
 * @tsplus static fncts.schema.ParseErrorOps format
 */
export function format(errors: Vector<ParseError>): string {
  return RoseTree(`${errors.length} error(s) found`, errors.map(go)).draw;
}

function formatActual(actual: unknown): string {
  return showWithOptions(actual, { colors: false });
}

function formatTemplateLiteralSpan(span: TemplateLiteralSpan): string {
  switch (span.type._tag) {
    case ASTTag.StringKeyword:
      return "${string}";
    case ASTTag.NumberKeyword:
      return "${number}";
  }
}

function formatTemplateLiteral(ast: TemplateLiteral): string {
  return ast.head + ast.spans.map((span) => formatTemplateLiteralSpan(span) + span.literal).join("");
}

function getExpected(ast: AST): Maybe<string> {
  return ast.annotations
    .get(ASTAnnotation.Identifier)
    .orElse(ast.annotations.get(ASTAnnotation.Title))
    .flatMap((title) =>
      ast.annotations.get(ASTAnnotation.Description).match(
        () => Just(title),
        (description) => Just(`${title} (${description})`),
      ),
    );
}

function getMissedBrands(ast: Validation): string {
  return ast.validation.map((validation) => validation.name).join(" & ");
}

function formatExpected(ast: AST): string {
  concrete(ast);
  switch (ast._tag) {
    case ASTTag.StringKeyword:
      return getExpected(ast).getOrElse("string");
    case ASTTag.NumberKeyword:
      return getExpected(ast).getOrElse("number");
    case ASTTag.BooleanKeyword:
      return getExpected(ast).getOrElse("boolean");
    case ASTTag.BigIntKeyword:
      return getExpected(ast).getOrElse("bigint");
    case ASTTag.UndefinedKeyword:
      return getExpected(ast).getOrElse("undefined");
    case ASTTag.SymbolKeyword:
      return getExpected(ast).getOrElse("symbol");
    case ASTTag.ObjectKeyword:
      return getExpected(ast).getOrElse("object");
    case ASTTag.AnyKeyword:
      return getExpected(ast).getOrElse("any");
    case ASTTag.UnknownKeyword:
      return getExpected(ast).getOrElse("unknown");
    case ASTTag.VoidKeyword:
      return getExpected(ast).getOrElse("void");
    case ASTTag.NeverKeyword:
      return getExpected(ast).getOrElse("never");
    case ASTTag.Literal:
      return getExpected(ast).getOrElse(formatActual(ast.literal));
    case ASTTag.UniqueSymbol:
      return getExpected(ast).getOrElse(formatActual(ast.symbol));
    case ASTTag.Union:
      return ast.types.map(formatExpected).join(" or ");
    case ASTTag.Refinement:
      return getExpected(ast).getOrElse("refinement");
    case ASTTag.TemplateLiteral:
      return getExpected(ast).getOrElse(formatTemplateLiteral(ast));
    case ASTTag.Tuple:
      return getExpected(ast).getOrElse("tuple or array");
    case ASTTag.TypeLiteral:
      return getExpected(ast).getOrElse("type literal");
    case ASTTag.Enum:
      return getExpected(ast).getOrElse(ast.enums.map(([_, value]) => JSON.stringify(value)).join(" | "));
    case ASTTag.Lazy:
      return getExpected(ast).getOrElse("<anonymous lazy schema>");
    case ASTTag.Declaration:
      return getExpected(ast).getOrElse("<anonymous Declaration schema>");
    case ASTTag.Transform:
      return `a parsable value from ${formatExpected(ast.from)} to ${formatExpected(ast.to)}`;
    case ASTTag.Validation:
      return getExpected(ast).match(
        () => getMissedBrands(ast),
        (expected) => `${expected} with validation(s) ${getMissedBrands(ast)}`,
      );
  }
}

function go(error: ParseError): RoseTree<string> {
  switch (error._tag) {
    case ParseErrorTag.Type:
      return RoseTree(
        error.expected.annotations
          .get(ASTAnnotation.Message)
          .map((f) => f(error.actual))
          .getOrElse(`Expected ${formatExpected(error.expected)}, actual ${formatActual(error.actual)}`),
      );
    case ParseErrorTag.Index:
      return RoseTree(`index ${error.index}`, error.errors.map(go));
    case ParseErrorTag.Unexpected:
      return RoseTree("is unexpected");
    case ParseErrorTag.Key:
      return RoseTree(`key ${formatActual(error.key)}`, error.errors.map(go));
    case ParseErrorTag.Missing:
      return RoseTree("is missing");
    case ParseErrorTag.UnionMember:
      return RoseTree("union member", error.errors.map(go));
  }
}
