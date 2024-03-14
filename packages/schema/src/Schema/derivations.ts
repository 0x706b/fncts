import type { TypeLiteral } from "@fncts/schema/AST";
import type { OptionalKeys, RequiredKeys } from "@fncts/typelevel/Object";

import { ownKeys } from "@fncts/schema/utils";

/**
 * @tsplus derive fncts.schema.Schema<_> 10
 */
export function deriveValidation<A extends Brand.Valid<any, any>>(
  ...[base, brands]: Check<Brand.IsValidated<A>> extends Check.True
    ? [
        base: Schema<Brand.Unbranded<A>>,
        brands: {
          [K in keyof A[Brand.valid] & string]: Validation<A[Brand.valid][K], K>;
        },
      ]
    : never
): Schema<A> {
  return Schema.fromAST(
    AST.createValidation(
      base.ast,
      Vector.from(Object.values(brands)),
      base.ast.annotations.annotate(ASTAnnotation.Brand, Vector.from(Object.values(brands))),
    ),
  );
}

/**
 * @tsplus derive fncts.schema.Schema<_> 20
 */
export function deriveLiteral<A extends LiteralValue>(
  ...[value]: Check<Check.IsLiteral<A> & Check.Not<Check.IsUnion<A>>> extends Check.True ? [value: A] : never
): Schema<A> {
  return Schema.literal(value);
}

type MaybeKeys<A> = { [K in keyof A]: A[K] extends Maybe<any> ? K : never }[keyof A];

/**
 * @tsplus derive fncts.schema.Schema<_> 20
 */
export function deriveStruct<A extends Record<string, any>>(
  ...[requiredFields, optionalFields, maybeFields]: Check<Check.IsStruct<A>> extends Check.True
    ? [
        ...[
          requiredFields: {
            [k in Exclude<RequiredKeys<A>, MaybeKeys<A>>]: Schema<A[k]>;
          },
        ],
        ...([OptionalKeys<A>] extends [never]
          ? [optionalFields: {}]
          : [
              optionalFields: {
                [k in OptionalKeys<A>]: Schema<NonNullable<A[k]>>;
              },
            ]),
        ...([MaybeKeys<A>] extends [never]
          ? []
          : [
              maybeFields: {
                [k in MaybeKeys<A>]: [A[k]] extends [Maybe<infer _A>] ? Schema<_A> : never;
              },
            ]),
      ]
    : never
): Schema<A> {
  const maybeFieldsKeys: Vector<PropertyKey> = ownKeys(maybeFields);
  let propertySignatures                     = ownKeys(requiredFields).map((key) =>
    // @ts-expect-error
    AST.createPropertySignature(key, requiredFields[key]!.ast, false, true),
  );

  if (optionalFields) {
    propertySignatures = propertySignatures.concat(
      // @ts-expect-error
      ownKeys(optionalFields).map((key) => AST.createPropertySignature(key, optionalFields[key]!.ast, true, true)),
    );
  }

  const struct = Schema.fromAST(AST.createTypeLiteral(propertySignatures, Vector.empty()));

  if (maybeFieldsKeys.isEmpty()) {
    return struct as Schema<any>;
  }

  propertySignatures = (struct.ast as TypeLiteral).propertySignatures;

  const from = Schema.fromAST<any>(
    AST.createTypeLiteral(
      propertySignatures.concat(
        maybeFieldsKeys.map((key) =>
          AST.createPropertySignature(
            key,
            // @ts-expect-error
            AST.createUnion(Vector(AST.undefinedKeyword, AST.createLiteral(null), maybeFields![key]!.ast)),
            true,
            true,
          ),
        ),
      ),
      Vector.empty(),
    ),
  );

  const to = Schema.fromAST<any>(
    AST.createTypeLiteral(
      propertySignatures.concat(
        maybeFieldsKeys.map((key) =>
          // @ts-expect-error
          AST.createPropertySignature(key, Schema.maybe(maybeFields![key]!).ast, false, true),
        ),
      ),
      Vector.empty(),
    ),
  );

  return from.transform(
    to,
    (input) => {
      const output = { ...input };
      for (const key of maybeFieldsKeys) {
        output[key] = Maybe.fromNullable(input[key]);
      }
      return output;
    },
    (input) => {
      const output = { ...input };
      for (const key of maybeFieldsKeys) {
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
 * @tsplus derive fncts.schema.Schema<_> 10
 */
export function deriveTuple<A extends ReadonlyArray<unknown>>(
  ...[components]: Check<Check.IsTuple<A>> extends Check.True ? [components: { [K in keyof A]: Schema<A[K]> }] : never
): Schema<A> {
  return unsafeCoerce(Schema.tuple(...components));
}

/**
 * @tsplus derive fncts.schema.Schema lazy
 */
export function deriveLazy<A>(f: (_: Schema<A>) => Schema<A>): Schema<A> {
  let cached: AST | undefined;
  const ast = AST.createLazy(() => {
    if (!cached) {
      cached = f(Schema.fromAST(ast)).ast;
    }
    return cached;
  });
  return Schema.fromAST(ast);
}

/**
 * @tsplus derive fncts.schema.Schema[fncts.ReadonlyArray]<_> 10
 */
export function deriveReadonlyArray<A extends ReadonlyArray<any>>(
  ...[element]: [A] extends [ReadonlyArray<infer _A>]
    ? Check<Check.IsEqual<A, ReadonlyArray<_A>>> extends Check.True
      ? [element: Schema<_A>]
      : never
    : never
): Schema<A> {
  return Schema.array(element) as unknown as Schema<A>;
}

/**
 * @tsplus derive fncts.schema.Schema[fncts.Array]<_> 10
 */
export function deriveArray<A extends Array<any>>(
  ...[element]: [A] extends [Array<infer _A>]
    ? Check<Check.IsEqual<A, Array<_A>>> extends Check.True
      ? [element: Schema<_A>]
      : never
    : never
): Schema<A> {
  return Schema.mutableArray(element) as unknown as Schema<A>;
}

/**
 * @tsplus derive fncts.schema.Schema<_> 15
 */
export function deriveRecord<A extends Record<string | symbol, any>>(
  ...[keySchema, valueSchema]: [A] extends [Record<infer X, infer Y>]
    ? Check<Check.Not<Check.IsUnion<A>> & Check.IsEqual<A, Record<X, Y>>> extends Check.True
      ? [keySchema: Schema<X>, valueSchema: Schema<Y>]
      : never
    : never
): Schema<A> {
  return Schema.record(keySchema as Schema<string | symbol>, valueSchema) as Schema<A>;
}
