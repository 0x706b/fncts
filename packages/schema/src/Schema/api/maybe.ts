import type { Check } from "@fncts/typelevel";

/**
 * @tsplus static fncts.schema.SchemaOps maybe
 * @tsplus getter fncts.schema.Schema maybe
 */
export function maybe<A>(value: Schema<A>): Schema<Maybe<A>> {
  return Schema.declaration(
    Vector(value),
    maybeInline(value),
    maybeParser,
    ASTAnnotationMap.empty.annotate(ASTAnnotation.Identifier, "Maybe"),
  );
}

/**
 * @tsplus static fncts.schema.SchemaOps maybeFromNullable
 * @tsplus getter fncts.schema.Schema maybeFromNullable
 */
export function maybeFromNullable<A>(value: Schema<A>): Schema<Maybe<A>> {
  return Schema.union(Schema.undefined, value.nullable).transform(value.maybe, Maybe.fromNullable, (input) =>
    input.getOrElse(null),
  );
}

/**
 * @tsplus derive fncts.schema.Schema[fncts.Maybe]<_> 10
 */
export function deriveMaybe<A extends Maybe<any>>(
  ...[value]: [A] extends [Maybe<infer _A>]
    ? Check<Check.IsEqual<A, Maybe<_A>>> extends Check.True
      ? [value: Schema<_A>]
      : never
    : never
): Schema<A> {
  return unsafeCoerce(maybeFromNullable(value));
}

function maybeParser<A>(value: Schema<A>): Parser<Maybe<A>> {
  const schema = maybe(value);
  return Parser.make((u, options) => {
    if (!Maybe.isMaybe(u)) {
      return ParseResult.fail(ParseError.TypeError(schema.ast, u));
    }
    Maybe.concrete(u);
    if (u.isNothing()) {
      return ParseResult.succeed(Nothing());
    } else {
      return value.decode(u.value, options).map((a) => Just(a));
    }
  });
}

function maybeInline<A>(value: Schema<A>): Schema<Maybe<A>> {
  return Schema.union(
    Schema.struct({
      _tag: Schema.literal("Nothing"),
      [Symbol.equals]: Schema.any,
      [Symbol.hash]: Schema.any,
    }),
    Schema.struct({
      _tag: Schema.literal("Just"),
      value,
      [Symbol.equals]: Schema.any,
      [Symbol.hash]: Schema.any,
    }),
  ) as unknown as Schema<Maybe<A>>;
}
