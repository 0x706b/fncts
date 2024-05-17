import type { MutableVector } from "@fncts/base/collection/immutable/Vector";
import type { Validation as ValidationType } from "@fncts/base/data/Branded";

import { show } from "@fncts/base/data/Showable";
import { memoize } from "@fncts/schema/utils";

import { ASTAnnotation } from "./ASTAnnotation.js";
import { ASTAnnotationMap } from "./ASTAnnotationMap.js";

export const ASTTypeId = Symbol.for("fncts.schema.AST");
export type ASTTypeId = typeof ASTTypeId;

export abstract class Annotated {
  readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty;
}

/**
 * @tsplus type fncts.schema.AST
 * @tsplus companion fncts.schema.ASTOps
 */
export abstract class AST extends Annotated {
  readonly [ASTTypeId]: ASTTypeId = ASTTypeId;

  abstract clone(newProperties: Partial<this>): AST;
}

export declare namespace AST {
  export interface Compiler<A> {
    (ast: AST): A;
  }

  export type Match<A> = {
    [K in Concrete["_tag"]]: (ast: Extract<Concrete, { _tag: K }>, compile: Compiler<A>) => A;
  };
}

export const enum ASTTag {
  Declaration,
  Literal,
  UniqueSymbol,
  UndefinedKeyword,
  VoidKeyword,
  NeverKeyword,
  UnknownKeyword,
  AnyKeyword,
  StringKeyword,
  NumberKeyword,
  BooleanKeyword,
  BigIntKeyword,
  SymbolKeyword,
  ObjectKeyword,
  Enum,
  TemplateLiteral,
  Tuple,
  TypeLiteral,
  Union,
  Lazy,
  Refinement,
  Transform,
  Validation,
}

export type Concrete =
  | Declaration
  | Literal
  | UniqueSymbol
  | UndefinedKeyword
  | VoidKeyword
  | NeverKeyword
  | UnknownKeyword
  | AnyKeyword
  | StringKeyword
  | NumberKeyword
  | BooleanKeyword
  | BigIntKeyword
  | SymbolKeyword
  | ObjectKeyword
  | Enum
  | TemplateLiteral
  | Tuple
  | TypeLiteral
  | Union
  | Lazy
  | Refinement
  | Transform
  | Validation;

/**
 * @tsplus static fncts.schema.ASTOps concrete
 * @tsplus macro remove
 */
export function concrete(_: AST): asserts _ is Concrete {
  //
}

export function getAnnotations<V>(key: ASTAnnotation<V>) {
  return (self: Annotated): Maybe<V> => {
    return self.annotations.get(key);
  };
}

/*
 * Declaration
 */

export class Declaration extends AST {
  readonly _tag = ASTTag.Declaration;
  constructor(
    readonly typeParameters: Vector<AST>,
    readonly type: AST,
    readonly decode: (
      ...typeParameters: ReadonlyArray<AST>
    ) => (input: any, options?: ParseOptions) => ParseResult<any>,
    readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
  ) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new Declaration(
      newProperties.typeParameters ?? this.typeParameters,
      newProperties.type ?? this.type,
      newProperties.decode ?? this.decode,
      newProperties.annotations ?? this.annotations,
    );
  }
}

/**
 * @tsplus static fncts.schema.ASTOps createDeclaration
 */
export function createDeclaration(
  typeParameters: Vector<AST>,
  type: AST,
  decode: (...typeParameters: ReadonlyArray<AST>) => (input: any, options?: ParseOptions) => ParseResult<any>,
  annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
): Declaration {
  return new Declaration(typeParameters, type, decode, annotations);
}

/**
 * @tsplus fluent fncts.schema.AST isDeclaration
 */
export function isDeclaration(self: AST): self is Declaration {
  concrete(self);
  return self._tag === ASTTag.Declaration;
}

/*
 * Literal
 */

export type LiteralValue = string | number | boolean | null | bigint;

export class Literal extends AST {
  readonly _tag = ASTTag.Literal;
  constructor(
    readonly literal: LiteralValue,
    readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
  ) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new Literal(newProperties.literal ?? this.literal, newProperties.annotations ?? this.annotations);
  }
}

/**
 * @tsplus static fncts.schema.ASTOps createLiteral
 */
export function createLiteral(literal: LiteralValue, annotations: ASTAnnotationMap = ASTAnnotationMap.empty): Literal {
  return new Literal(literal, annotations);
}

/**
 * @tsplus fluent fncts.schema.AST isLiteral
 */
export function isLiteral(self: AST): self is Literal {
  concrete(self);
  return self._tag === ASTTag.Literal;
}

/*
 * UniqueSymbol
 */

export class UniqueSymbol extends AST {
  readonly _tag = ASTTag.UniqueSymbol;
  constructor(
    readonly symbol: symbol,
    readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
  ) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new UniqueSymbol(newProperties.symbol ?? this.symbol, newProperties.annotations ?? this.annotations);
  }
}

/**
 * @tsplus static fncts.schema.ASTOps createUniqueSymbol
 */
export function createUniqueSymbol(
  symbol: symbol,
  annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
): UniqueSymbol {
  return new UniqueSymbol(symbol, annotations);
}

/**
 * @tsplus fluent fncts.schema.AST isUniqueSymbol
 */
export function isUniqueSymbol(self: AST): self is UniqueSymbol {
  concrete(self);
  return self._tag === ASTTag.UniqueSymbol;
}

/*
 * UndefinedKeyword
 */

export class UndefinedKeyword extends AST {
  readonly _tag = ASTTag.UndefinedKeyword;
  constructor(readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new UndefinedKeyword(newProperties.annotations ?? this.annotations);
  }
}

/**
 * @tsplus static fncts.schema.ASTOps undefinedKeyword
 */
export const undefinedKeyword: UndefinedKeyword = new UndefinedKeyword(
  ASTAnnotationMap.empty.annotate(ASTAnnotation.Title, "undefined"),
);

/*
 * VoidKeyword
 */

export class VoidKeyword extends AST {
  readonly _tag = ASTTag.VoidKeyword;
  constructor(readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new VoidKeyword(newProperties.annotations ?? this.annotations);
  }
}

/**
 * @tsplus static fncts.schema.ASTOps voidKeyword
 */
export const voidKeyword: VoidKeyword = new VoidKeyword(ASTAnnotationMap.empty.annotate(ASTAnnotation.Title, "void"));

/*
 * NeverKeyword
 */

export class NeverKeyword extends AST {
  readonly _tag = ASTTag.NeverKeyword;
  constructor(readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new NeverKeyword(newProperties.annotations ?? this.annotations);
  }
}

/**
 * @tsplus static fncts.schema.ASTOps neverKeyword
 */
export const neverKeyword: NeverKeyword = new NeverKeyword(
  ASTAnnotationMap.empty.annotate(ASTAnnotation.Title, "never"),
);

/*
 * UnknownKeyword
 */

export class UnknownKeyword extends AST {
  readonly _tag = ASTTag.UnknownKeyword;
  constructor(readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new UnknownKeyword(newProperties.annotations ?? this.annotations);
  }
}

/**
 * @tsplus static fncts.schema.ASTOps unknownKeyword
 */
export const unknownKeyword: UnknownKeyword = new UnknownKeyword(
  ASTAnnotationMap.empty.annotate(ASTAnnotation.Title, "unknown"),
);

/*
 * AnyKeyword
 */

export class AnyKeyword extends AST {
  readonly _tag = ASTTag.AnyKeyword;
  constructor(readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new AnyKeyword(newProperties.annotations ?? this.annotations);
  }
}

/**
 * @tsplus static fncts.schema.ASTOps anyKeyword
 */
export const anyKeyword: AnyKeyword = new AnyKeyword(ASTAnnotationMap.empty.annotate(ASTAnnotation.Title, "any"));

/*
 * StringKeyword
 */

export class StringKeyword extends AST {
  readonly _tag = ASTTag.StringKeyword;
  constructor(readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new StringKeyword(newProperties.annotations ?? this.annotations);
  }
}

/**
 * @tsplus static fncts.schema.ASTOps stringKeyword
 */
export const stringKeyword: StringKeyword = new StringKeyword(
  ASTAnnotationMap.empty.annotate(ASTAnnotation.Title, "string"),
);

/**
 * @tsplus fluent fncts.schema.AST isStringKeyword
 */
export function isStringKeyword(self: AST): self is StringKeyword {
  concrete(self);
  return self._tag === ASTTag.StringKeyword;
}

/*
 * NumberKeyword
 */

export class NumberKeyword extends AST {
  readonly _tag = ASTTag.NumberKeyword;
  constructor(readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new NumberKeyword(newProperties.annotations ?? this.annotations);
  }
}

/**
 * @tsplus static fncts.schema.ASTOps numberKeyword
 */
export const numberKeyword: NumberKeyword = new NumberKeyword(
  ASTAnnotationMap.empty.annotate(ASTAnnotation.Title, "number"),
);

/**
 * @tsplus fluent fncts.schema.AST isNumberKeyword
 */
export function isNumberKeyword(self: AST): self is NumberKeyword {
  concrete(self);
  return self._tag === ASTTag.NumberKeyword;
}

/*
 * BooleanKeyword
 */

export class BooleanKeyword extends AST {
  readonly _tag = ASTTag.BooleanKeyword;
  constructor(readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new BooleanKeyword(newProperties.annotations ?? this.annotations);
  }
}

/**
 * @tsplus static fncts.schema.ASTOps booleanKeyword
 */
export const booleanKeyword: BooleanKeyword = new BooleanKeyword(
  ASTAnnotationMap.empty.annotate(ASTAnnotation.Title, "boolean"),
);

/**
 * @tsplus fluent fncts.schema.AST isBooleanKeyword
 */
export function isBooleanKeyword(self: AST): self is BooleanKeyword {
  concrete(self);
  return self._tag === ASTTag.BooleanKeyword;
}

/*
 * BigIntKeyword
 */

export class BigIntKeyword extends AST {
  readonly _tag = ASTTag.BigIntKeyword;
  constructor(readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new BigIntKeyword(newProperties.annotations ?? this.annotations);
  }
}

/**
 * @tsplus static fncts.schema.ASTOps bigIntKeyword
 */
export const bigIntKeyword: BigIntKeyword = new BigIntKeyword(
  ASTAnnotationMap.empty.annotate(ASTAnnotation.Title, "bigint"),
);

/**
 * @tsplus fluent fncts.schema.AST isBigIntKeyword
 */
export function isBigIntKeyword(self: AST): self is BigIntKeyword {
  concrete(self);
  return self._tag === ASTTag.BigIntKeyword;
}

/*
 * SymbolKeyword
 */

export class SymbolKeyword extends AST {
  readonly _tag = ASTTag.SymbolKeyword;
  constructor(readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new SymbolKeyword(newProperties.annotations ?? this.annotations);
  }
}

/**
 * @tsplus static fncts.schema.ASTOps symbolKeyword
 */
export const symbolKeyword: SymbolKeyword = new SymbolKeyword(
  ASTAnnotationMap.empty.annotate(ASTAnnotation.Title, "symbol"),
);

/**
 * @tsplus fluent fncts.schema.AST isSymbolKeyword
 */
export function isSymbolKeyword(self: AST): self is SymbolKeyword {
  concrete(self);
  return self._tag === ASTTag.SymbolKeyword;
}

/*
 * ObjectKeyword
 */

export class ObjectKeyword extends AST {
  readonly _tag = ASTTag.ObjectKeyword;
  constructor(readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new ObjectKeyword(newProperties.annotations ?? this.annotations);
  }
}

/**
 * @tsplus static fncts.schema.ASTOps objectKeyword
 */
export const objectKeyword: ObjectKeyword = new ObjectKeyword(
  ASTAnnotationMap.empty.annotate(ASTAnnotation.Title, "object"),
);

/*
 * Enum
 */

export class Enum extends AST {
  readonly _tag = ASTTag.Enum;
  constructor(
    readonly enums: Vector<readonly [string, string | number]>,
    readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
  ) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new Enum(newProperties.enums ?? this.enums, newProperties.annotations ?? this.annotations);
  }
}

/**
 * @tsplus static fncts.schema.ASTOps createEnum
 */
export function createEnum(
  enums: Vector<readonly [string, string | number]>,
  annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
): Enum {
  return new Enum(enums, annotations);
}

export class TemplateLiteralSpan {
  constructor(
    readonly type: StringKeyword | NumberKeyword,
    readonly literal: string,
  ) {}
}

/*
 * TemplateLiteral
 */

export class TemplateLiteral extends AST {
  readonly _tag = ASTTag.TemplateLiteral;
  constructor(
    readonly head: string,
    readonly spans: Vector<TemplateLiteralSpan>,
    readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
  ) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return createTemplateLiteral(
      newProperties.head ?? this.head,
      newProperties.spans ?? this.spans,
      newProperties.annotations ?? this.annotations,
    );
  }
}

/**
 * @tsplus static fncts.schema.ASTOps createTemplateLiteral
 */
export function createTemplateLiteral(
  head: string,
  spans: Vector<TemplateLiteralSpan>,
  annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
): TemplateLiteral | Literal {
  if (spans.isNonEmpty()) {
    return new TemplateLiteral(head, spans, annotations);
  } else {
    return createLiteral(head, annotations);
  }
}

/*
 * Element
 */

export class Element {
  constructor(
    readonly type: AST,
    readonly isOptional: boolean,
  ) {}
}

/**
 * @tsplus static fncts.schema.ASTOps createElement
 */
export function createElement(type: AST, isOptional: boolean): Element {
  return new Element(type, isOptional);
}

/*
 * Tuple
 */

export class Tuple extends AST {
  readonly _tag = ASTTag.Tuple;
  constructor(
    readonly elements: Vector<Element>,
    readonly rest: Maybe<Vector<AST>>,
    readonly isReadonly: boolean,
    readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
  ) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new Tuple(
      newProperties.elements ?? this.elements,
      newProperties.rest ?? this.rest,
      newProperties.isReadonly ?? this.isReadonly,
      newProperties.annotations ?? this.annotations,
    );
  }
}

/**
 * @tsplus static fncts.schema.ASTOps createTuple
 */
export function createTuple(
  elements: Vector<Element>,
  rest: Maybe<Vector<AST>>,
  isReadonly: boolean,
  annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
): Tuple {
  return new Tuple(elements, rest, isReadonly, annotations);
}

/**
 * @tsplus static fncts.schema.ASTOps unknownArray
 */
export const unknownArray = AST.createTuple(Vector.empty(), Just(Vector(AST.unknownKeyword)), true);

/*
 * PropertySignature
 */

export class PropertySignature extends AST {
  constructor(
    readonly name: PropertyKey,
    readonly type: AST,
    readonly isOptional: boolean,
    readonly isReadonly: boolean,
    readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
  ) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new PropertySignature(
      newProperties.name ?? this.name,
      newProperties.type ?? this.type,
      newProperties.isOptional ?? this.isOptional,
      newProperties.isReadonly ?? this.isReadonly,
      newProperties.annotations ?? this.annotations,
    );
  }
}

/**
 * @tsplus static fncts.schema.ASTOps createPropertySignature
 */
export function createPropertySignature(
  name: PropertyKey,
  type: AST,
  isOptional: boolean,
  isReadonly: boolean,
  annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
): PropertySignature {
  return new PropertySignature(name, type, isOptional, isReadonly, annotations);
}

/*
 * IndexSignature
 */

export class IndexSignature {
  constructor(
    readonly parameter: StringKeyword | SymbolKeyword | TemplateLiteral | Refinement,
    readonly type: AST,
    readonly isReadonly: boolean,
  ) {}
}

/**
 * @tsplus static fncts.schema.ASTOps createIndexSignature
 */
export function createIndexSignature(
  parameter: StringKeyword | SymbolKeyword | TemplateLiteral | Refinement,
  type: AST,
  isReadonly: boolean,
): IndexSignature {
  return new IndexSignature(parameter, type, isReadonly);
}

/*
 * TypeLiteral
 */

export class TypeLiteral extends AST {
  readonly _tag = ASTTag.TypeLiteral;
  readonly propertySignatures: Vector<PropertySignature>;
  readonly indexSignatures: Vector<IndexSignature>;
  constructor(
    propertySignatures: Vector<PropertySignature>,
    indexSignatures: Vector<IndexSignature>,
    readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
  ) {
    super();
    this.propertySignatures = sortByAscendingCardinality(propertySignatures);
    this.indexSignatures    = sortByAscendingCardinality(indexSignatures);
  }

  clone(newProperties: Partial<this>): AST {
    return new TypeLiteral(
      newProperties.propertySignatures ?? this.propertySignatures,
      newProperties.indexSignatures ?? this.indexSignatures,
      newProperties.annotations ?? this.annotations,
    );
  }
}

/**
 * @tsplus static fncts.schema.ASTOps isTypeLiteral
 * @tsplus fluent fncts.schema.AST isTypeLiteral
 */
export function isTypeLiteral(self: AST): self is TypeLiteral {
  concrete(self);
  return self._tag === ASTTag.TypeLiteral;
}

/**
 * @tsplus static fncts.schema.ASTOps createTypeLiteral
 */
export function createTypeLiteral(
  propertySignatures: Vector<PropertySignature>,
  indexSignatures: Vector<IndexSignature>,
  annotations?: ASTAnnotationMap,
): TypeLiteral {
  return new TypeLiteral(propertySignatures, indexSignatures, annotations);
}

/**
 * @tsplus static fncts.schema.ASTOps unknownRecord
 */
export const unknownRecord = AST.createTypeLiteral(
  Vector.empty(),
  Vector(
    AST.createIndexSignature(AST.stringKeyword, AST.unknownKeyword, true),
    AST.createIndexSignature(AST.symbolKeyword, AST.unknownKeyword, true),
  ),
);

/*
 * Union
 */

export class Union extends AST {
  readonly _tag = ASTTag.Union;
  constructor(
    readonly types: Vector<AST>,
    readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
  ) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return createUnion(newProperties.types ?? this.types, newProperties.annotations ?? this.annotations);
  }
}

/**
 * @tsplus fluent fncts.schema.AST isUnion
 */
export function isUnion(self: AST): self is Union {
  concrete(self);
  return self._tag === ASTTag.Union;
}

/**
 * @tsplus static fncts.schema.ASTOps createUnion
 */
export function createUnion(candidates: Vector<AST>, annotations: ASTAnnotationMap = ASTAnnotationMap.empty) {
  const types = unify(candidates);
  switch (types.length) {
    case 0:
      return neverKeyword;
    case 1:
      return types.unsafeGet(0)!;
    default:
      return new Union(sortByDescendingWeight(types), annotations);
  }
}

/*
 * Lazy
 */

export class Lazy extends AST {
  readonly _tag = ASTTag.Lazy;
  constructor(
    readonly getAST: () => AST,
    readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
  ) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new Lazy(newProperties.getAST ?? this.getAST, newProperties.annotations ?? this.annotations);
  }
}

/**
 * @tsplus static fncts.schema.ASTOps createLazy
 */
export function createLazy(getAST: () => AST, annotations?: ASTAnnotationMap) {
  return new Lazy(getAST, annotations);
}

/**
 * @tsplus fluent fncts.schema.AST isLazy
 */
export function isLazy(self: AST): self is Lazy {
  AST.concrete(self);
  return self._tag === ASTTag.Lazy;
}

/*
 * Refinement
 */

export class Refinement extends AST {
  readonly _tag = ASTTag.Refinement;
  constructor(
    readonly from: AST,
    readonly predicate: (input: any) => boolean,
    readonly isReversed: boolean,
    readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
  ) {
    super();
  }

  decode(input: any, options?: ParseOptions): ParseResult<any> {
    return this.predicate(input) ? ParseResult.succeed(input) : ParseResult.fail(ParseError.TypeError(this, input));
  }

  clone(newProperties: Partial<this>): AST {
    return new Refinement(
      newProperties.from ?? this.from,
      newProperties.predicate ?? this.predicate,
      newProperties.isReversed ?? this.isReversed,
      newProperties.annotations ?? this.annotations,
    );
  }
}

/**
 * @tsplus static fncts.schema.ASTOps createRefinement
 */
export function createRefinement(
  from: AST,
  predicate: (input: any) => boolean,
  isReversed: boolean,
  annotations?: ASTAnnotationMap,
): Refinement {
  return new Refinement(from, predicate, isReversed, annotations);
}

export function isRefinement(self: AST): self is Refinement {
  concrete(self);
  return self._tag === ASTTag.Refinement;
}

export interface ParseOptions {
  readonly isUnexpectedAllowed?: boolean;
  readonly allErrors?: boolean;
}

/*
 * Transform
 */

export class Transform extends AST {
  readonly _tag = ASTTag.Transform;
  constructor(
    readonly from: AST,
    readonly to: AST,
    readonly decode: (input: any, options?: ParseOptions) => ParseResult<any>,
    readonly encode: (input: any, options?: ParseOptions) => ParseResult<any>,
    readonly isReversed: boolean,
    readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
  ) {
    super();
  }

  clone(newProperties: Partial<this>): AST {
    return new Transform(
      newProperties.from ?? this.from,
      newProperties.to ?? this.to,
      newProperties.decode ?? this.decode,
      newProperties.encode ?? this.encode,
      newProperties.isReversed ?? this.isReversed,
      newProperties.annotations ?? this.annotations,
    );
  }
}

/**
 * @tsplus static fncts.schema.ASTOps createTransform
 */
export function createTransform(
  from: AST,
  to: AST,
  decode: (input: any, options?: ParseOptions) => ParseResult<any>,
  encode: (input: any, options?: ParseOptions) => ParseResult<any>,
  isReversed: boolean,
  annotations?: ASTAnnotationMap,
): Transform {
  return new Transform(from, getTo(to), decode, encode, isReversed, annotations);
}

/*
 * Validation
 */

export class Validation extends AST {
  readonly _tag = ASTTag.Validation;
  constructor(
    readonly from: AST,
    readonly validation: Vector<ValidationType<any, string>>,
    readonly annotations: ASTAnnotationMap = ASTAnnotationMap.empty,
  ) {
    super();
  }
  clone(newProperties: Partial<this>): AST {
    return new Validation(
      newProperties.from ?? this.from,
      newProperties.validation ?? this.validation,
      newProperties.annotations ?? this.annotations,
    );
  }
}

/**
 * @tsplus static fncts.schema.ASTOps createValidation
 */
export function createValidation(
  from: AST,
  validation: Vector<ValidationType<any, string>>,
  annotations?: ASTAnnotationMap,
): Validation {
  return new Validation(from, validation, annotations);
}

/**
 * @tsplus tailRec
 */
export function getCardinality(ast: AST): number {
  concrete(ast);
  switch (ast._tag) {
    case ASTTag.Declaration:
      return getCardinality(ast.type);
    case ASTTag.NeverKeyword:
      return 0;
    case ASTTag.Literal:
    case ASTTag.UndefinedKeyword:
    case ASTTag.VoidKeyword:
    case ASTTag.UniqueSymbol:
      return 1;
    case ASTTag.BooleanKeyword:
      return 2;
    case ASTTag.StringKeyword:
    case ASTTag.NumberKeyword:
    case ASTTag.BigIntKeyword:
    case ASTTag.SymbolKeyword:
      return 3;
    case ASTTag.ObjectKeyword:
      return 4;
    case ASTTag.UnknownKeyword:
    case ASTTag.AnyKeyword:
      return 6;
    case ASTTag.Refinement:
      return getCardinality(ast.from);
    case ASTTag.Transform:
      return getCardinality(ast.to);
    default:
      return 5;
  }
}

function sortByAscendingCardinality<A extends { readonly type: AST }>(types: Vector<A>): Vector<A> {
  return types.sort(Number.Ord.contramap(({ type }) => getCardinality(type)));
}

export function getWeight(ast: AST): number {
  concrete(ast);
  switch (ast._tag) {
    case ASTTag.Declaration:
      return getWeight(ast.type);
    case ASTTag.Tuple:
      return ast.elements.length + (ast.rest.isJust() ? ast.rest.value.length : 0);
    case ASTTag.TypeLiteral:
      return ast.propertySignatures.length + ast.indexSignatures.length;
    case ASTTag.Union:
      return ast.types.foldLeft(0, (n, member) => n + getWeight(member));
    case ASTTag.Lazy:
      return 10;
    case ASTTag.Refinement:
      return getWeight(ast.from);
    case ASTTag.Transform:
      return getWeight(ast.to);
    default:
      return 0;
  }
}

function sortByDescendingWeight(types: Vector<AST>): Vector<AST> {
  return types.sort(Number.Ord.contramap(getWeight));
}

function unify(candidates: Vector<AST>): Vector<AST> {
  let out = candidates.flatMap((ast) => {
    concrete(ast);
    switch (ast._tag) {
      case ASTTag.NeverKeyword:
        return Vector.empty<AST>();
      case ASTTag.Union:
        return ast.types;
      default:
        return Vector(ast);
    }
  });
  if (out.some(isStringKeyword)) {
    out = out.filter((m) => !(m.isLiteral() && typeof m.literal === "string"));
  }
  if (out.some(isNumberKeyword)) {
    out = out.filter((m) => !(m.isLiteral() && typeof m.literal === "number"));
  }
  if (out.some(isSymbolKeyword)) {
    out = out.filter((m) => !m.isUniqueSymbol());
  }
  return out;
}

/**
 * @tsplus pipeable fncts.schema.AST combineAnnotations
 */
export function combineAnnotations(annotations: ASTAnnotationMap) {
  return (self: AST): AST => {
    return self.clone({ annotations: self.annotations.combine(annotations) });
  };
}

/**
 * @tsplus pipeable fncts.schema.AST setAnnotation
 */
export function setAnnotation<A>(annotation: ASTAnnotation<A>, value: A) {
  return (self: AST): AST => {
    return self.clone({ annotations: self.annotations.annotate(annotation, value) });
  };
}

/**
 * @tsplus pipeable fncts.schema.AST appendRestElement
 */
export function appendRestElement(restElement: AST) {
  return (self: Tuple): Tuple => {
    if (self.rest.isJust()) {
      throw new Error("A rest element cannot follow another rest element. ts(1265)");
    }
    return createTuple(self.elements, Just(Vector(restElement)), self.isReadonly, self.annotations);
  };
}

/**
 * @tsplus pipeable fncts.schema.AST appendElement
 */
export function appendElement(element: Element) {
  return (self: Tuple): Tuple => {
    if (self.elements.some((e) => e.isOptional) && !element.isOptional) {
      throw new Error("A required element cannot follow an optional element. ts(1257)");
    }
    return self.rest.match(
      () => createTuple(self.elements.append(element), Nothing(), self.isReadonly, self.annotations),
      (rest) => {
        if (element.isOptional) {
          throw new Error("A required element cannot follow an optional element. ts(1257)");
        }
        return createTuple(self.elements, Just(rest.append(element.type)), self.isReadonly, self.annotations);
      },
    );
  };
}

export function getParameter(x: IndexSignature["parameter"]): StringKeyword | SymbolKeyword | TemplateLiteral {
  return isRefinement(x) ? getParameter(x.from as any) : x;
}

/**
 * @tsplus getter fncts.schema.AST getPropertySignatures
 */
export function getPropertySignatures(self: AST): Vector<PropertySignature> {
  concrete(self);
  switch (self._tag) {
    case ASTTag.Declaration:
      return getPropertySignatures(self.type);
    case ASTTag.Tuple:
      return self.elements.mapWithIndex((i, element) =>
        createPropertySignature(i, element.type, element.isOptional, self.isReadonly),
      );
    case ASTTag.Union: {
      const propertySignatures = self.types.map(getPropertySignatures);
      return propertySignatures[0]!.filterMap(({ name }) => {
        if (propertySignatures.every((ps) => ps.some((p) => p.name === name))) {
          const members = propertySignatures.flatMap((ps) => ps.filter((p) => p.name === name));
          return Just(
            createPropertySignature(
              name,
              createUnion(members.map((p) => p.type)),
              members.some((p) => p.isOptional),
              members.some((p) => p.isReadonly),
            ),
          );
        }
        return Nothing();
      });
    }
    case ASTTag.Lazy:
      return getPropertySignatures(self.getAST());
    case ASTTag.Refinement:
      return getPropertySignatures(self.from);
    case ASTTag.Transform:
      return getPropertySignatures(self.to);
    default:
      return Vector.empty();
  }
}

/**
 * @tsplus getter fncts.schema.AST keysof
 */
export function keysOf(ast: AST): Vector<AST> {
  concrete(ast);
  switch (ast._tag) {
    case ASTTag.Declaration:
      return keysOf(ast.type);
    case ASTTag.NeverKeyword:
    case ASTTag.AnyKeyword:
      return Vector(stringKeyword, numberKeyword, symbolKeyword);
    case ASTTag.StringKeyword:
      return Vector(createLiteral("length"));
    case ASTTag.TypeLiteral:
      return ast.propertySignatures
        .map((p) => (typeof p.name === "symbol" ? createUniqueSymbol(p.name) : createLiteral(p.name)))
        .concat(ast.indexSignatures.map((is) => getParameter(is.parameter)));
    case ASTTag.Union:
      return getPropertySignatures(ast).map((p) =>
        typeof p.name === "symbol" ? createUniqueSymbol(p.name) : createLiteral(p.name),
      );
    case ASTTag.Lazy:
      return keysOf(ast.getAST());
    case ASTTag.Refinement:
      return keysOf(ast.from);
    case ASTTag.Transform:
      return keysOf(ast.to);
    default:
      return Vector.empty();
  }
}

/**
 * @tsplus getter fncts.schema.AST keyof
 */
export function keyof(self: AST): AST {
  return AST.createUnion(self.keysof);
}

/**
 * @tsplus static fncts.schema.ASTOps createRecord
 */
export function createRecord(key: AST, value: AST, isReadonly: boolean): TypeLiteral {
  const propertySignatures: MutableVector<PropertySignature> = Vector.emptyPushable();
  const indexSignatures: MutableVector<IndexSignature>       = Vector.emptyPushable();

  function go(key: AST): void {
    concrete(key);
    switch (key._tag) {
      case ASTTag.Declaration:
        go(key.type);
        break;
      case ASTTag.NeverKeyword:
        break;
      case ASTTag.StringKeyword:
      case ASTTag.SymbolKeyword:
      case ASTTag.TemplateLiteral:
      case ASTTag.Refinement:
        indexSignatures.push(createIndexSignature(key, value, isReadonly));
        break;
      case ASTTag.Literal:
        if (typeof key.literal === "string" || typeof key.literal === "number") {
          propertySignatures.push(createPropertySignature(key.literal, value, false, isReadonly));
        }
        break;
      case ASTTag.UniqueSymbol:
        propertySignatures.push(createPropertySignature(key.symbol, value, false, isReadonly));
        break;
      case ASTTag.Union:
        key.types.forEach(go);
        break;
      default:
        throw new Error(`createRecord: Unsupported key\n${show(key)}`);
    }
  }
  go(key);
  return createTypeLiteral(propertySignatures, indexSignatures);
}

/**
 * @tsplus pipeable fncts.schema.AST pick
 */
export function pick(keys: Vector<PropertyKey>) {
  return (self: AST): TypeLiteral => {
    return createTypeLiteral(
      self.getPropertySignatures.filter((ps) => keys.includes(ps.name)),
      Vector.empty(),
    );
  };
}

/**
 * @tsplus pipeable fncts.schema.AST omit
 */
export function omit(keys: Vector<PropertyKey>) {
  return (self: AST): TypeLiteral => {
    return createTypeLiteral(
      self.getPropertySignatures.filter((ps) => !keys.includes(ps.name)),
      Vector.empty(),
    );
  };
}

/**
 * @tsplus getter fncts.schema.AST partial
 */
export function partial(self: AST): AST {
  concrete(self);
  switch (self._tag) {
    case ASTTag.Declaration:
      return partial(self.type);
    case ASTTag.Tuple:
      return createTuple(
        self.elements.map((e) => createElement(e.type, true)),
        self.rest.map((rest) => Vector(createUnion(rest.append(undefinedKeyword)))),
        self.isReadonly,
      );
    case ASTTag.TypeLiteral:
      return createTypeLiteral(
        self.propertySignatures.map((f) => createPropertySignature(f.name, f.type, true, f.isReadonly, f.annotations)),
        self.indexSignatures,
      );
    case ASTTag.Union:
      return createUnion(self.types.map(partial));
    case ASTTag.Lazy:
      return createLazy(() => partial(self.getAST()));
    case ASTTag.Refinement:
      return partial(self.from);
    case ASTTag.Transform:
      return partial(self.to);
    default:
      return self;
  }
}

/**
 * @tsplus static fncts.schema.AST createKey
 */
export function createKey(key: PropertyKey): AST {
  return typeof key === "symbol" ? AST.createUniqueSymbol(key) : AST.createLiteral(key);
}

/**
 * @tsplus getter fncts.schema.AST getFrom
 */
export function getFrom(ast: AST): AST {
  AST.concrete(ast);
  switch (ast._tag) {
    case ASTTag.Declaration:
      return AST.createDeclaration(ast.typeParameters.map(getFrom), ast.type, ast.decode, ast.annotations);
    case ASTTag.Tuple:
      return AST.createTuple(
        ast.elements.map((element) => AST.createElement(getFrom(element.type), element.isOptional)),
        ast.rest.map((restElement) => restElement.map(getFrom)),
        ast.isReadonly,
        ast.annotations,
      );
    case ASTTag.TypeLiteral:
      return AST.createTypeLiteral(
        ast.propertySignatures.map((ps) =>
          AST.createPropertySignature(ps.name, getFrom(ps.type), ps.isOptional, ps.isReadonly, ps.annotations),
        ),
        ast.indexSignatures.map((is) => AST.createIndexSignature(is.parameter, getFrom(is.type), is.isReadonly)),
        ast.annotations,
      );
    case ASTTag.Union:
      return AST.createUnion(ast.types.map(getFrom), ast.annotations);
    case ASTTag.Lazy:
      return AST.createLazy(() => getFrom(ast.getAST()), ast.annotations);
    case ASTTag.Refinement:
    case ASTTag.Transform:
      return getFrom(ast.from);
  }
  return ast;
}

/**
 * @tsplus getter fncts.schema.AST getTo
 */
export function getTo(ast: AST): AST {
  AST.concrete(ast);
  switch (ast._tag) {
    case ASTTag.Declaration:
      return AST.createDeclaration(ast.typeParameters.map(getTo), ast.type, ast.decode, ast.annotations);
    case ASTTag.Tuple:
      return AST.createTuple(
        ast.elements.map((element) => AST.createElement(getTo(element.type), element.isOptional)),
        ast.rest.map((restElement) => restElement.map(getTo)),
        ast.isReadonly,
        ast.annotations,
      );
    case ASTTag.TypeLiteral:
      return AST.createTypeLiteral(
        ast.propertySignatures.map((ps) =>
          AST.createPropertySignature(ps.name, getTo(ps.type), ps.isOptional, ps.isReadonly, ps.annotations),
        ),
        ast.indexSignatures.map((is) => AST.createIndexSignature(is.parameter, getTo(is.type), is.isReadonly)),
        ast.annotations,
      );
    case ASTTag.Union:
      return AST.createUnion(ast.types.map(getTo), ast.annotations);
    case ASTTag.Lazy:
      return AST.createLazy(() => getTo(ast.getAST()), ast.annotations);
    case ASTTag.Refinement:
      return AST.createRefinement(getTo(ast.from), ast.predicate, false, ast.annotations);
    case ASTTag.Transform:
      return getTo(ast.to);
  }
  return ast;
}

/**
 * @tsplus getter fncts.schema.AST reverse
 */
export function reverse(ast: AST): AST {
  AST.concrete(ast);
  switch (ast._tag) {
    case ASTTag.Declaration:
      return AST.createDeclaration(ast.typeParameters.map(reverse), ast.type, ast.decode, ast.annotations);
    case ASTTag.Tuple:
      return AST.createTuple(
        ast.elements.map((element) => AST.createElement(reverse(element.type), element.isOptional)),
        ast.rest.map((restElement) => restElement.map(reverse)),
        ast.isReadonly,
        ast.annotations,
      );
    case ASTTag.TypeLiteral:
      return AST.createTypeLiteral(
        ast.propertySignatures.map((ps) =>
          AST.createPropertySignature(ps.name, reverse(ps.type), ps.isOptional, ps.isReadonly, ps.annotations),
        ),
        ast.indexSignatures.map((is) => AST.createIndexSignature(is.parameter, reverse(is.type), is.isReadonly)),
        ast.annotations,
      );
    case ASTTag.Union:
      return AST.createUnion(ast.types.map(reverse), ast.annotations);
    case ASTTag.Lazy:
      return AST.createLazy(() => reverse(ast.getAST()), ast.annotations);
    case ASTTag.Refinement:
      return AST.createRefinement(ast.from, ast.predicate, !ast.isReversed, ast.annotations);
    case ASTTag.Transform:
      return AST.createTransform(reverse(ast.from), ast.to, ast.decode, ast.encode, !ast.isReversed, ast.annotations);
  }
  return ast;
}

/**
 * @tsplus static fncts.schema.AST getCompiler
 */
export function getCompiler<A>(match: AST.Match<A>): AST.Compiler<A> {
  const compile: AST.Compiler<A> = memoize((ast: AST) => {
    AST.concrete(ast);
    return match[ast._tag](ast as any, compile);
  });
  return compile;
}
