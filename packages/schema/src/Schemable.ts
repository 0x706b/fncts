import type { Brand, Validation } from "@fncts/base/data/Branded";
import type { Schema, UnionSchema } from "@fncts/schema/Schema";
import type { Literal } from "@fncts/typelevel/Any";

export type SchemableKind<F extends HKT, A> = F extends { readonly type: unknown }
  ? (F & { readonly A: A })["type"]
  : {
      readonly _F: F;
      readonly _A: A;
    };

type TypeOf<K> = [K] extends [SchemableKind<any, infer A>] ? A : never;

export interface Schemable<F extends HKT> {
  readonly unknown: SchemableKind<F, unknown>;
  readonly string: SchemableKind<F, string>;
  readonly number: SchemableKind<F, number>;
  readonly boolean: SchemableKind<F, boolean>;
  readonly bigint: SchemableKind<F, bigint>;
  readonly literal: <A extends Literal>(literal: A) => SchemableKind<F, A>;
  readonly nullable: <A>(or: SchemableKind<F, A>) => SchemableKind<F, A | null | undefined>;
  readonly struct: <P extends Record<string, any>>(properties: {
    [K in keyof P]: SchemableKind<F, P[K]>;
  }) => SchemableKind<F, P>;
  readonly partial: <P extends Record<string, any>>(properties: {
    [K in keyof P]: SchemableKind<F, P[K]>;
  }) => SchemableKind<F, Partial<P>>;
  readonly array: <A>(item: SchemableKind<F, A>) => SchemableKind<F, ReadonlyArray<A>>;
  readonly record: <A>(codomain: SchemableKind<F, A>) => SchemableKind<F, Record<string, A>>;
  readonly tuple: <C extends ReadonlyArray<any>>(
    ...components: {
      [K in keyof C]: SchemableKind<F, C[K]>;
    }
  ) => SchemableKind<F, C>;
  readonly lazy: <A>(f: () => SchemableKind<F, A>) => SchemableKind<F, A>;
  readonly validation: <A, B extends ReadonlyArray<Validation<A, any>>>(
    ...validations: B
  ) => (
    base: SchemableKind<F, A>,
  ) => SchemableKind<
    F,
    A & { [K in keyof B]: B[K] extends Validation<any, infer S> ? Brand.Valid<A, S> : never }[number]
  >;
  readonly union: <A extends ReadonlyArray<any>>(
    members: { [K in keyof A]: SchemableKind<F, A[K]> },
    schema: UnionSchema<A>,
  ) => SchemableKind<F, A[number]>;
}
