import type { Declaration, Refinement, Transform, Tuple, TypeLiteral, Union } from "@fncts/schema/AST";

export const enum ParseErrorTag {
  Declaration,
  Type,
  Index,
  Key,
  Missing,
  Unexpected,
  UnionMember,
  Refinement,
  Transformation,
  TypeLiteral,
  Tuple,
  Union,
  Iterable,
}

/**
 * @tsplus type fncts.schema.ParseError
 * @tsplus companion fncts.schema.ParseErrorOps
 */
export type ParseError =
  | DeclarationError
  | TypeError
  | RefinementError
  | TransformationError
  | TypeLiteralError
  | TupleError
  | UnionError
  | IterableError;

/**
 * @tsplus companion fncts.schema.ParseError.DeclarationError
 */
export class DeclarationError {
  readonly _tag = ParseErrorTag.Declaration;
  constructor(
    readonly ast: Declaration,
    readonly actual: unknown,
    readonly error: ParseError,
  ) {}
}

/**
 * @tsplus static fncts.schema.ParseError.DeclarationError __call
 * @tsplus static fncts.schema.ParseErrorOps DeclarationError
 */
export function declarationError(ast: Declaration, actual: unknown, error: ParseError): DeclarationError {
  return new DeclarationError(ast, actual, error);
}

/**
 * @tsplus companion fncts.schema.ParseError.TypeError
 */
export class TypeError {
  readonly _tag = ParseErrorTag.Type;
  constructor(
    readonly ast: AST,
    readonly actual: unknown,
  ) {}
}

/**
 * @tsplus static fncts.schema.ParseError.TypeError __call
 * @tsplus static fncts.schema.ParseErrorOps TypeError
 */
export function typeError(expected: AST, actual: unknown): TypeError {
  return new TypeError(expected, actual);
}

/**
 * @tsplus companion fncts.schema.ParseError.TypeLiteralError
 */
export class TypeLiteralError {
  readonly _tag = ParseErrorTag.TypeLiteral;
  constructor(
    readonly ast: TypeLiteral,
    readonly actual: unknown,
    readonly errors: Vector<KeyError>,
    readonly output: { readonly [x: string]: unknown } = {},
  ) {}
}

/**
 * @tsplus static fncts.schema.ParseError.TypeLiteralError __call
 * @tsplus static fncts.schema.ParseErrorOps TypeLiteralError
 */
export function typeLiteralError(
  ast: TypeLiteral,
  actual: unknown,
  errors: Vector<KeyError>,
  output: { readonly [x: string]: unknown } = {},
): TypeLiteralError {
  return new TypeLiteralError(ast, actual, errors, output);
}

/**
 * @tsplus companion fncts.schema.ParseError.TupleError
 */
export class TupleError {
  readonly _tag = ParseErrorTag.Tuple;
  constructor(
    readonly ast: Tuple,
    readonly actual: unknown,
    readonly errors: Vector<IndexError>,
    readonly output: ReadonlyArray<unknown> = [],
  ) {}
}

/**
 * @tsplus static fncts.schema.ParseError.TupleError __call
 * @tsplus static fncts.schema.ParseErrorOps TupleError
 */
export function tupleError(
  ast: Tuple,
  actual: unknown,
  errors: Vector<IndexError>,
  output: ReadonlyArray<unknown> = [],
): TupleError {
  return new TupleError(ast, actual, errors, output);
}

/**
 * @tsplus companion fncts.schema.ParseError.IndexError
 */
export class IndexError {
  readonly _tag = ParseErrorTag.Index;
  constructor(
    readonly index: number,
    readonly error: ParseError | MissingError | UnexpectedError,
  ) {}
}

/**
 * @tsplus static fncts.schema.ParseError.IndexError __call
 * @tsplus static fncts.schema.ParseErrorOps IndexError
 */
export function indexError(index: number, error: ParseError | MissingError | UnexpectedError): IndexError {
  return new IndexError(index, error);
}

/**
 * @tsplus companion fncts.schema.ParseError.KeyError
 */
export class KeyError {
  readonly _tag = ParseErrorTag.Key;
  constructor(
    readonly keyAST: AST,
    readonly key: any,
    readonly error: ParseError | MissingError | UnexpectedError,
  ) {}
}

/**
 * @tsplus static fncts.schema.ParseError.KeyError __call
 * @tsplus static fncts.schema.ParseErrorOps KeyError
 */
export function keyError(keyAST: AST, key: any, error: ParseError | MissingError | UnexpectedError): KeyError {
  return new KeyError(keyAST, key, error);
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
export function unexpectedError(actual: unknown): UnexpectedError {
  return new UnexpectedError(actual);
}

/**
 * @tsplus companion fncts.schema.ParseError.UnionError
 */
export class UnionError {
  readonly _tag = ParseErrorTag.Union;
  constructor(
    readonly ast: Union,
    readonly actual: unknown,
    readonly errors: Vector<TypeError | TypeLiteralError | UnionMemberError>,
  ) {}
}

/**
 * @tsplus static fncts.schema.ParseError.UnionError __call
 * @tsplus static fncts.schema.ParseErrorOps UnionError
 */
export function unionError(
  ast: Union,
  actual: unknown,
  errors: Vector<TypeError | TypeLiteralError | UnionMemberError>,
): UnionError {
  return new UnionError(ast, actual, errors);
}

/**
 * @tsplus companion fncts.schema.ParseError.UnionMemberError
 */
export class UnionMemberError {
  readonly _tag = ParseErrorTag.UnionMember;
  constructor(
    readonly ast: AST,
    readonly error: ParseError,
  ) {}
}

/**
 * @tsplus static fncts.schema.ParseError.UnionMemberError __call
 * @tsplus static fncts.schema.ParseErrorOps UnionMemberError
 */
export function unionMemberError(ast: AST, error: ParseError): UnionMemberError {
  return new UnionMemberError(ast, error);
}

/**
 * @tsplus companion fncts.schema.ParseError.RefinementError
 */
export class RefinementError {
  readonly _tag = ParseErrorTag.Refinement;
  constructor(
    readonly ast: Refinement,
    readonly actual: unknown,
    readonly kind: "From" | "Predicate",
    readonly error: ParseError,
  ) {}
}

/**
 * @tsplus static fncts.schema.ParseError.RefinementError __call
 * @tsplus static fncts.schema.ParseErrorOps RefinementError
 */
export function refinementError(
  ast: Refinement,
  actual: unknown,
  kind: "From" | "Predicate",
  error: ParseError,
): ParseError {
  return new RefinementError(ast, actual, kind, error);
}

/**
 * @tsplus companion fncts.schema.ParseError.TransformationError
 */
export class TransformationError {
  readonly _tag = ParseErrorTag.Transformation;
  constructor(
    readonly ast: Transform,
    readonly actual: unknown,
    readonly kind: "Encoded" | "Transformation" | "Type",
    readonly error: ParseError,
  ) {}
}

/**
 * @tsplus static fncts.schema.ParseError.TransformationError __call
 * @tsplus static fncts.schema.ParseErrorOps TransformationError
 */
export function transformationError(
  ast: Transform,
  actual: unknown,
  kind: "Encoded" | "Transformation" | "Type",
  error: ParseError,
): ParseError {
  return new TransformationError(ast, actual, kind, error);
}

/**
 * @tsplus companion fncts.schema.ParseError.IterableError
 */
export class IterableError {
  readonly _tag = ParseErrorTag.Iterable;
  constructor(
    readonly ast: AST,
    readonly actual: unknown,
    readonly errors: Vector<IndexError | KeyError>,
  ) {}
}

/**
 * @tsplus static fncts.schema.ParseError.IterableError __call
 * @tsplus static fncts.schema.ParseErrorOps IterableError
 */
export function iterableError(ast: AST, actual: unknown, errors: Vector<IndexError | KeyError>): IterableError {
  return new IterableError(ast, actual, errors);
}
