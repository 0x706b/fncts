export const SchemaVariance = Symbol.for("fncts.schema.Schema.Variance");
export type SchemaVariance = typeof SchemaVariance;

export const SchemaTypeId = Symbol.for("fncts.schema.Schema");
export type SchemaTypeId = typeof SchemaTypeId;

export const OptionalSchemaSymbol = Symbol.for("fncts.schema.Schema.OptionalSchema");
export type OptionalSchemaSymbol = typeof OptionalSchemaSymbol;

export interface SchemaF extends HKT {
  readonly type: Schema<this["A"]>;
}

/**
 * @tsplus type fncts.schema.Schema
 * @tsplus companion fncts.schema.SchemaOps
 */
export class Schema<in out A> {
  readonly [SchemaTypeId]: SchemaTypeId = SchemaTypeId;
  declare [SchemaVariance]: {
    _A: (_: A) => A;
  };
  constructor(readonly ast: AST) {}
}

export interface OptionalSchema<in out A> extends Schema<A> {
  [OptionalSchemaSymbol]: OptionalSchemaSymbol;
}

export declare namespace Schema {
  export type Infer<S extends Schema<any>> = Parameters<S[SchemaVariance]["_A"]>[0];
}

/**
 * @tsplus static fncts.schema.SchemaOps isSchema
 */
export function isSchema(u: unknown): u is Schema<unknown> {
  return isObject(u) && SchemaTypeId in u;
}
