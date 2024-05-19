import type { Literal, ParseOptions, TemplateLiteral, TypeLiteral } from "../AST.js";
import type { Brand, Validation } from "@fncts/base/data/Branded";

import { show } from "@fncts/base/data/Showable";

import { getParameter } from "../AST.js";
import { ASTTag, concrete, TemplateLiteralSpan } from "../AST.js";
import { ownKeys } from "../utils.js";

/**
 * @tsplus static fncts.schema.SchemaOps fromAST
 */
export function make<A>(ast: AST): Schema<A> {
  return new Schema(ast);
}

/**
 * @tsplus pipeable fncts.schema.Schema annotate
 */
export function annotate<V>(annotation: ASTAnnotation<V>, value: V) {
  return <A>(self: Schema<A>): Schema<A> => {
    return Schema.fromAST(self.ast.clone({ annotations: self.ast.annotations.annotate(annotation, value) }));
  };
}

/**
 * @tsplus static fncts.schema.SchemaOps declaration
 */
export function declaration(
  typeParameters: Vector<Schema<any>>,
  type: Schema<any>,
  decode: (...typeParameters: ReadonlyArray<Schema<any>>) => Parser<any>,
  annotations?: ASTAnnotationMap,
): Schema<any> {
  return Schema.fromAST(
    AST.createDeclaration(
      typeParameters.map((tp) => tp.ast),
      type.ast,
      (...typeParameters) => decode(...typeParameters.map(Schema.fromAST)),
      annotations,
    ),
  );
}

/**
 * @tsplus pipeable fncts.schema.Schema filter
 */
export function filter<A, B extends A>(refinement: Refinement<A, B>): (self: Schema<A>) => Schema<B>;
export function filter<A>(predicate: Predicate<A>): (self: Schema<A>) => Schema<A>;
export function filter<A>(predicate: Predicate<A>) {
  return (self: Schema<A>): Schema<A> => {
    const ast: AST = AST.createRefinement(self.ast, predicate);
    return Schema.fromAST(ast);
  };
}

/**
 * @tsplus pipeable fncts.schema.Schema brand
 */
export function brand<A, K extends string>(validation: Validation<A, K>) {
  return (self: Schema<A>): Schema<A & Brand.Valid<A, K>> => {
    const ast = AST.createRefinement(
      self.ast,
      validation.validate,
      self.ast.annotations.annotate(ASTAnnotation.Brand, Vector(validation)),
    );
    return Schema.fromAST(ast);
  };
}

function makeLiteral<Literal extends LiteralValue>(value: Literal): Schema<Literal> {
  return Schema.fromAST(AST.createLiteral(value));
}

/**
 * @tsplus static fncts.schema.SchemaOps literal
 */
export function literal<Literals extends ReadonlyArray<LiteralValue>>(...literals: Literals): Schema<Literals[number]> {
  return Schema.union(...literals.map(makeLiteral));
}

/**
 * @tsplus static fncts.schema.SchemaOps never
 * @tsplus implicit
 */
export const never: Schema<never> = Schema.fromAST(AST.neverKeyword);

/**
 * @tsplus static fncts.schema.SchemaOps unknown
 * @tsplus implicit
 */
export const unknown: Schema<unknown> = Schema.fromAST(AST.unknownKeyword);

/**
 * @tsplus static fncts.schema.SchemaOps any
 */
export const any: Schema<any> = Schema.fromAST(AST.anyKeyword);

/**
 * @tsplus static fncts.schema.SchemaOps undefined
 * @tsplus implicit
 */
export const _undefined: Schema<undefined> = Schema.fromAST(AST.undefinedKeyword);

export { _undefined as undefined };

/**
 * @tsplus static fncts.schema.SchemaOps null
 * @tsplus implicit
 */
export const _null: Schema<null> = Schema.fromAST(AST.createLiteral(null));

export { _null as null };

/**
 * @tsplus static fncts.schema.SchemaOps void
 * @tsplus implicit
 */
export const _void: Schema<void> = Schema.fromAST(AST.voidKeyword);

export { _void as void };

/**
 * @tsplus static fncts.schema.SchemaOps string
 * @tsplus implicit
 */
export const string: Schema<string> = Schema.fromAST(AST.stringKeyword);

/**
 * @tsplus static fncts.schema.SchemaOps number
 * @tsplus implicit
 */
export const number: Schema<number> = Schema.fromAST(AST.numberKeyword);

/**
 * @tsplus static fncts.schema.SchemaOps boolean
 * @tsplus implicit
 */
export const boolean: Schema<boolean> = Schema.fromAST(AST.booleanKeyword);

/**
 * @tsplus static fncts.schema.SchemaOps bigint
 * @tsplus implicit
 */
export const bigint: Schema<bigint> = Schema.fromAST(AST.bigIntKeyword);

/**
 * @tsplus static fncts.schema.SchemaOps symbol
 * @tsplus implicit
 */
export const symbol: Schema<symbol> = Schema.fromAST(AST.symbolKeyword);

/**
 * @tsplus static fncts.schema.SchemaOps object
 * @tsplus implicit
 */
export const object: Schema<object> = Schema.fromAST(AST.objectKeyword);

/**
 * @tsplus static fncts.schema.SchemaOps date
 */
export const date: Schema<Date> = Schema.object.instanceOf(Date);

/**
 * @tsplus implicit
 */
export const implicitDate: Schema<Date> = Schema.unknown.transformOrFail(
  Schema.date,
  (input, options) => {
    if (typeof input === "string" || typeof input === "number") {
      return ParseResult.succeed(new Date(input));
    } else {
      return Schema.date.decode(input, options);
    }
  },
  (input) => ParseResult.succeed(input),
);

/**
 * @tsplus static fncts.schema.SchemaOps union
 * @tsplus derive fncts.schema.Schema<|> 30
 */
export function union<A extends ReadonlyArray<unknown>>(
  ...members: {
    [K in keyof A]: Schema<A[K]>;
  }
): Schema<A[number]> {
  return Schema.fromAST(AST.createUnion(Vector.from(members.map((m) => m.ast))));
}

/**
 * @tsplus getter fncts.schema.Schema nullable
 */
export function nullable<A>(self: Schema<A>): Schema<A | null> {
  return Schema.union(Schema.null, self);
}

/**
 * @tsplus static fncts.schema.SchemaOps uniqueSymbol
 */
export function uniqueSymbol<S extends symbol>(symbol: S, annotations?: ASTAnnotationMap): Schema<S> {
  return Schema.fromAST(AST.createUniqueSymbol(symbol, annotations));
}

/**
 * @tsplus getter fncts.schema.Schema optional
 */
export function optional<A>(self: Schema<A>): OptionalSchema<A> {
  return Schema.fromAST(
    self.ast.clone({ annotations: self.ast.annotations.annotate(ASTAnnotation.Optional, true) }),
  ) as OptionalSchema<A>;
}

/**
 * @tsplus fluent fncts.schema.Schema isOptional
 */
export function isOptional<A>(self: Schema<A>): self is OptionalSchema<A> {
  return self.ast.annotations.get(ASTAnnotation.Optional).getOrElse(false);
}

export type OptionalSchemaKeys<T> = { [K in keyof T]: T[K] extends OptionalSchema<any> ? K : never }[keyof T];

/**
 * @tsplus getter fncts.schema.Schema parseOptional
 */
export function parseOptional<A>(self: Schema<A>): Schema<Maybe<A>> {
  return Schema.fromAST(
    self.ast.clone({ annotations: self.ast.annotations.annotate(ASTAnnotation.ParseOptional, true) }),
  );
}

/**
 * @tsplus fluent fncts.schema.Schema isParseOptional
 */
export function isParseOptional<A>(self: Schema<A>): boolean {
  return self.ast.annotations.get(ASTAnnotation.ParseOptional).getOrElse(false);
}

export type Spread<A> = {
  [K in keyof A]: A[K];
} extends infer B
  ? B
  : never;

/**
 * @tsplus static fncts.schema.SchemaOps struct
 */
export function struct<Fields extends Record<PropertyKey, Schema<any>>>(
  fields: Fields,
): Schema<
  Spread<
    { readonly [K in Exclude<keyof Fields, OptionalSchemaKeys<Fields>>]: Schema.Infer<Fields[K]> } & {
      readonly [K in OptionalSchemaKeys<Fields>]?: Schema.Infer<Fields[K]>;
    }
  >
> {
  const parseOptionalKeys: Vector<PropertyKey> = ownKeys(fields).filter((key) => isParseOptional(fields[key]!));
  const struct = Schema.fromAST(
    AST.createTypeLiteral(
      ownKeys(fields).map((key) => AST.createPropertySignature(key, fields[key]!.ast, isOptional(fields[key]!), true)),
      Vector.empty(),
    ),
  );
  if (parseOptionalKeys.isEmpty()) {
    return struct as Schema<any>;
  }
  const propertySignatures = (struct.ast as TypeLiteral).propertySignatures;
  const from               = Schema.fromAST<any>(
    AST.createTypeLiteral(
      propertySignatures.map((p) =>
        parseOptionalKeys.includes(p.name)
          ? AST.createPropertySignature(
              p.name,
              AST.createUnion(Vector(AST.undefinedKeyword, AST.createLiteral(null), p.type)),
              true,
              p.isReadonly,
            )
          : p,
      ),
      Vector.empty(),
    ),
  );
  const to = Schema.fromAST<any>(
    AST.createTypeLiteral(
      propertySignatures.map((p) => {
        if (parseOptionalKeys.includes(p.name)) {
          if (fields[p.name]!.ast.isLazy()) {
            return AST.createPropertySignature(
              p.name,
              AST.createLazy(() => Schema.maybe(fields[p.name]!).ast),
              true,
              p.isReadonly,
            );
          }
          return AST.createPropertySignature(p.name, Schema.maybe(fields[p.name]!).ast, true, p.isReadonly);
        }
        return p;
      }),
      Vector.empty(),
    ),
  );
  return from.transform(
    to,
    (input) => {
      const output = { ...input };
      for (const key of parseOptionalKeys) {
        output[key] = Maybe.fromNullable(input[key]);
      }
      return output;
    },
    (input) => {
      const output = { ...input };
      for (const key of parseOptionalKeys) {
        const value: Maybe<any> = input[key];
        if (value.isNothing()) {
          delete output[key];
          continue;
        }
        output[key] = value.value;
      }
      return output;
    },
  );
}

/**
 * @tsplus static fncts.schema.SchemaOps tuple
 */
export function tuple<Elements extends ReadonlyArray<Schema<any>>>(
  ...elements: Elements
): Schema<{ readonly [K in keyof Elements]: Schema.Infer<Elements[K]> }> {
  return Schema.fromAST(
    AST.createTuple(Vector.from(elements.map((schema) => AST.createElement(schema.ast, false))), Nothing(), true),
  );
}

/**
 * @tsplus static fncts.schema.SchemaOps lazy
 */
export function lazy<A>(f: () => Schema<A>, annotations?: ASTAnnotationMap): Schema<A> {
  return Schema.fromAST(AST.createLazy(() => f().ast, annotations));
}

/**
 * @tsplus static fncts.schema.SchemaOps array
 * @tsplus getter fncts.schema.Schema array
 */
export function array<A>(item: Schema<A>): Schema<ReadonlyArray<A>> {
  return Schema.fromAST(AST.createTuple(Vector.empty(), Just(Vector(item.ast)), true));
}

/**
 * @tsplus static fncts.schema.SchemaOps mutableArray
 * @tsplus getter fncts.schema.Schema mutableArray
 */
export function mutableArray<A>(item: Schema<A>): Schema<Array<A>> {
  return Schema.fromAST(AST.createTuple(Vector.empty(), Just(Vector(item.ast)), false));
}

/**
 * @tsplus static fncts.schema.SchemaOps record
 */
export function record<K extends string | symbol, V>(
  key: Schema<K>,
  value: Schema<V>,
): Schema<{ readonly [k in K]: V }> {
  return Schema.fromAST(AST.createRecord(key.ast, value.ast, true));
}

/**
 * @tsplus static fncts.schema.SchemaOps enum
 */
export function enum_<A extends { [x: string]: string | number }>(enums: A): Schema<A[keyof A]> {
  return Schema.fromAST(
    AST.createEnum(
      Vector.from(
        Object.keys(enums)
          .filter((key) => typeof enums[enums[key]!] !== "number")
          .map((key) => [key, enums[key]!]),
      ),
    ),
  );
}

export { enum_ as enum };

type Join<T> = T extends [infer Head, ...infer Tail]
  ? `${Head & (string | number | bigint | boolean | null | undefined)}${Tail extends [] ? "" : Join<Tail>}`
  : never;

function getTemplateLiterals(ast: AST): Vector<TemplateLiteral | Literal> {
  concrete(ast);
  switch (ast._tag) {
    case ASTTag.Literal:
      return Vector(ast);
    case ASTTag.NumberKeyword:
    case ASTTag.StringKeyword:
      return Vector(AST.createTemplateLiteral("", Vector(new TemplateLiteralSpan(ast, ""))));
    case ASTTag.Union:
      return ast.types.flatMap(getTemplateLiterals);
    default:
      throw new Error(`Unsupported template literal span ${show(ast)}`);
  }
}

function combineTemplateLiterals(
  a: TemplateLiteral | Literal,
  b: TemplateLiteral | Literal,
): TemplateLiteral | Literal {
  if (a.isLiteral()) {
    return b.isLiteral()
      ? AST.createLiteral(String(a.literal) + String(b.literal))
      : AST.createTemplateLiteral(String(a.literal) + b.head, b.spans);
  }
  if (b.isLiteral()) {
    if (!a.spans.isNonEmpty()) {
      throw new Error("Invalid template literal");
    }
    const last = a.spans.unsafeLast!;
    return AST.createTemplateLiteral(
      a.head,
      a.spans.slice(0, -1).append(new TemplateLiteralSpan(last.type, last.literal + String(b.literal))),
    );
  }
  if (!a.spans.isNonEmpty()) {
    throw new Error("Invalid template literal");
  }
  const last = a.spans.unsafeLast!;
  return AST.createTemplateLiteral(
    a.head,
    a.spans
      .slice(0, -1)
      .append(new TemplateLiteralSpan(last.type, last.literal + String(b.head)))
      .concat(b.spans),
  );
}

/**
 * @tsplus static fncts.schema.SchemaOps templateLiteral
 */
export function templateLiteral<T extends [Schema<any>, ...Array<Schema<any>>]>(
  ...[head, ...tail]: T
): Schema<Join<{ [K in keyof T]: Schema.Infer<T[K]> }>> {
  let types: Vector<TemplateLiteral | Literal> = getTemplateLiterals(head.ast);
  for (const span of tail) {
    types = types.flatMap((a) => getTemplateLiterals(span.ast).map((b) => combineTemplateLiterals(a, b)));
  }
  return Schema.fromAST(AST.createUnion(types));
}

/**
 * @tsplus static fncts.schema.SchemaOps keyof
 * @tsplus getter fncts.schema.Schema keyof
 */
export function keyof<A>(self: Schema<A>): Schema<keyof A> {
  return Schema.fromAST(self.ast.keyof);
}

function isOverlappingPropertySignatures(x: TypeLiteral, y: TypeLiteral): boolean {
  return x.propertySignatures.some((px) => y.propertySignatures.some((py) => px.name === py.name));
}

function isOverlappingIndexSignatures(x: TypeLiteral, y: TypeLiteral): boolean {
  return x.indexSignatures.some((ix) =>
    y.indexSignatures.some((iy) => {
      const bx = getParameter(ix.parameter);
      const by = getParameter(iy.parameter);
      return (bx.isStringKeyword() && by.isStringKeyword()) || (bx.isSymbolKeyword() && by.isSymbolKeyword());
    }),
  );
}

/**
 * @tsplus pipeable fncts.schema.Schema extend
 */
export function extend<B>(that: Schema<B>) {
  return <A>(self: Schema<A>): Schema<Spread<A & B>> => {
    const selfTypes = self.ast.isUnion() ? self.ast.types : Vector(self.ast);
    const thatTypes = that.ast.isUnion() ? that.ast.types : Vector(that.ast);
    if (selfTypes.every(AST.isTypeLiteral) && thatTypes.every(AST.isTypeLiteral)) {
      return Schema.fromAST(
        AST.createUnion(
          selfTypes.flatMap((x) =>
            thatTypes.map((y) => {
              if (isOverlappingPropertySignatures(x, y)) {
                throw new Error("`extend` cannot handle overlapping property signatures");
              }
              if (isOverlappingIndexSignatures(x, y)) {
                throw new Error("`extend` cannot handle overlapping index signatures");
              }
              return AST.createTypeLiteral(
                x.propertySignatures.concat(y.propertySignatures),
                x.indexSignatures.concat(y.indexSignatures),
              );
            }),
          ),
        ),
      );
    }
    throw new Error("`extend can only handle type literals or unions of type literals`");
  };
}

/**
 * @tsplus pipeable fncts.schema.Schema instanceOf
 */
export function instanceOf<A extends abstract new (...args: any) => any>(constructor: A) {
  return (self: Schema<object>): Schema<InstanceType<A>> => {
    return self
      .filter((value): value is InstanceType<A> => value instanceof constructor)
      .annotate(ASTAnnotation.Description, `an instance of ${constructor.name}`);
  };
}

/**
 * @tsplus pipeable fncts.schema.Schema transformOrFail
 */
export function transformOrFail<A, B>(
  to: Schema<B>,
  decode: (input: A, options?: ParseOptions) => ParseResult<B>,
  encode: (input: B, options?: ParseOptions) => ParseResult<A>,
) {
  return (from: Schema<A>): Schema<B> => {
    return Schema.fromAST(AST.createTransform(from.ast, to.ast, decode, encode));
  };
}

/**
 * @tsplus pipeable fncts.schema.Schema transform
 */
export function transform<A, B>(
  to: Schema<B>,
  decode: (input: A, options?: ParseOptions) => B,
  encode: (input: B, options?: ParseOptions) => A,
) {
  return (from: Schema<A>): Schema<B> => {
    return from.transformOrFail(
      to,
      (input, options) => ParseResult.succeed(decode(input, options)),
      (input, options) => ParseResult.succeed(encode(input, options)),
    );
  };
}
