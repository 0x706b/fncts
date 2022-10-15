import type { Brand, Validation } from "@fncts/base/data/Branded";
import type { Schemable as S, SchemableKind } from "@fncts/schema/Schemable";
import type { Literal } from "@fncts/typelevel/Any";

export const SchemaTypeId = Symbol.for("fncts.schema.Schema");
export type SchemaTypeId = typeof SchemaTypeId;

export const enum SchemaTag {
  Unknown,
  String,
  Number,
  Boolean,
  BigInt,
  Literal,
  Nullable,
  Struct,
  Partial,
  Array,
  Record,
  Tuple,
  Lazy,
  Validation,
  Union,
}

export interface SchemaF extends HKT {
  readonly type: Schema<this["A"]>;
}

export abstract class Schema<in out A> {
  readonly _typeId: SchemaTypeId = SchemaTypeId;
  declare _A: (_: A) => A;
}

export class UnknownSchema extends Schema<unknown> {
  readonly _tag = SchemaTag.Unknown;
}

export class StringSchema extends Schema<string> {
  readonly _tag = SchemaTag.String;
}

export class NumberSchema extends Schema<number> {
  readonly _tag = SchemaTag.Number;
}

export class BooleanSchema extends Schema<boolean> {
  readonly _tag = SchemaTag.Boolean;
}

export class BigIntSchema extends Schema<bigint> {
  readonly _tag = SchemaTag.BigInt;
}

export class LiteralSchema<A extends Literal> extends Schema<A> {
  readonly _tag = SchemaTag.Literal;
  constructor(readonly value: A) {
    super();
  }
}

export class NullableSchema<A> extends Schema<A | null | undefined> {
  readonly _tag = SchemaTag.Nullable;
  constructor(readonly base: Schema<A>) {
    super();
  }
}

export class StructSchema<A extends Record<string, any>> extends Schema<A> {
  readonly _tag = SchemaTag.Struct;
  constructor(readonly fields: { [K in keyof A]: Schema<A[K]> }) {
    super();
  }
}

export class PartialSchema<A extends Record<string, any>> extends Schema<Partial<A>> {
  readonly _tag = SchemaTag.Partial;
  constructor(readonly fields: { [K in keyof A]: Schema<A[K]> }) {
    super();
  }
}

export class ArraySchema<A> extends Schema<ReadonlyArray<A>> {
  readonly _tag = SchemaTag.Array;
  constructor(readonly base: Schema<A>) {
    super();
  }
}

export class RecordSchema<A> extends Schema<Record<string, A>> {
  readonly _tag = SchemaTag.Record;
  constructor(readonly base: Schema<A>) {
    super();
  }
}

export class TupleSchema<A extends ReadonlyArray<any>> extends Schema<A> {
  readonly _tag = SchemaTag.Tuple;
  constructor(readonly components: { [K in keyof A]: Schema<A[K]> }) {
    super();
  }
}

export class LazySchema<A> extends Schema<A> {
  readonly _tag = SchemaTag.Lazy;
  constructor(readonly make: () => Schema<A>) {
    super();
  }
}

export class ValidationSchema<A, B extends ReadonlyArray<Validation<A, any>>> extends Schema<
  A & { [K in keyof B]: B[K] extends Validation<any, infer S> ? Brand.Valid<A, S> : never }[number]
> {
  readonly _tag = SchemaTag.Validation;
  constructor(readonly base: Schema<A>, readonly validations: readonly [...B]) {
    super();
  }
}

export class UnionSchema<A extends ReadonlyArray<any>> extends Schema<A[number]> {
  readonly _tag = SchemaTag.Union;
  constructor(readonly members: { [K in keyof A]: Schema<A[K]> }) {
    super();
  }
}

export const unknown: Schema<unknown> = new UnknownSchema();

export const string: Schema<string> = new StringSchema();

export const number: Schema<number> = new NumberSchema();

export const boolean: Schema<boolean> = new BooleanSchema();

export const bigint: Schema<bigint> = new BigIntSchema();

export function literal<A extends Literal>(value: A): Schema<A> {
  return new LiteralSchema(value);
}

export function nullable<A>(base: Schema<A>): Schema<A | null | undefined> {
  return new NullableSchema(base);
}

export function struct<A extends Record<string, any>>(fields: { [K in keyof A]: Schema<A[K]> }): Schema<A> {
  return new StructSchema(fields);
}

export function partial<A extends Record<string, any>>(fields: { [K in keyof A]: Schema<A[K]> }): Schema<Partial<A>> {
  return new PartialSchema(fields);
}

export function array<A>(base: Schema<A>): Schema<ReadonlyArray<A>> {
  return new ArraySchema(base);
}

export function record<A>(base: Schema<A>): Schema<Record<string, A>> {
  return new RecordSchema(base);
}

export function tuple<A extends ReadonlyArray<any>>(...components: { [K in keyof A]: Schema<A[K]> }): Schema<A> {
  return new TupleSchema(components).unsafeCoerce();
}

export function lazy<A>(make: () => Schema<A>): Schema<A> {
  return new LazySchema(make);
}

export function validation<A, B extends ReadonlyArray<Validation<A, any>>>(...validations: B) {
  return (
    base: Schema<A>,
  ): Schema<A & { [K in keyof B]: B[K] extends Validation<any, infer S> ? Brand.Valid<A, S> : never }[number]> =>
    new ValidationSchema(base, validations).unsafeCoerce();
}

export function union<A extends ReadonlyArray<any>>(...members: { [K in keyof A]: Schema<A[K]> }): Schema<A[number]> {
  return new UnionSchema(members);
}

export type Concrete =
  | UnknownSchema
  | StringSchema
  | NumberSchema
  | BooleanSchema
  | BigIntSchema
  | LiteralSchema<any>
  | NullableSchema<any>
  | StructSchema<Record<string, any>>
  | PartialSchema<Record<string, any>>
  | ArraySchema<any>
  | RecordSchema<any>
  | TupleSchema<ReadonlyArray<any>>
  | LazySchema<any>
  | ValidationSchema<any, ReadonlyArray<Validation<any, any>>>
  | UnionSchema<ReadonlyArray<any>>;

export function concrete(_: Schema<any>): asserts _ is Concrete {
  //
}

function cacheThunk<A>(f: () => A): () => A {
  let cached: A;
  return () => {
    if (!cached) {
      cached = f();
    }
    return cached;
  };
}

export function interpret<F extends HKT>(S: S<F>): <A>(schema: Schema<A>) => SchemableKind<F, A>;
export function interpret<F extends HKT>(S: S<F>) {
  return <A>(schema: Schema<A>): SchemableKind<F, any> => {
    concrete(schema);
    switch (schema._tag) {
      case SchemaTag.Unknown:
        return S.unknown;
      case SchemaTag.String:
        return S.string;
      case SchemaTag.Number:
        return S.number;
      case SchemaTag.Boolean:
        return S.boolean;
      case SchemaTag.BigInt:
        return S.bigint;
      case SchemaTag.Literal:
        return S.literal(schema.value);
      case SchemaTag.Lazy:
        const cached = cacheThunk(schema.make);
        return S.lazy(() => interpret(S)(cached()));
      case SchemaTag.Nullable:
        return S.nullable(interpret(S)(schema.base));
      case SchemaTag.Struct:
        return S.struct(Dictionary.reverseGet(Dictionary.get(schema.fields).map(interpret(S))));
      case SchemaTag.Partial:
        return S.partial(Dictionary.reverseGet(Dictionary.get(schema.fields).map(interpret(S))));
      case SchemaTag.Array:
        return S.array(interpret(S)(schema.base));
      case SchemaTag.Record:
        return S.record(interpret(S)(schema.base));
      case SchemaTag.Tuple:
        return S.tuple(...schema.components.map(interpret(S)));
      case SchemaTag.Validation:
        return S.validation(...schema.validations)(interpret(S)(schema.base));
      case SchemaTag.Union:
        return S.union(schema.members.map(interpret(S)), schema);
    }
  };
}
