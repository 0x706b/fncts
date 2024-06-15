import type { Check } from "@fncts/typelevel";

/**
 * @tsplus static fncts.schema.SchemaOps maybe
 * @tsplus getter fncts.schema.Schema maybe
 */
export function maybe<A>(value: Schema<A>): Schema<Maybe<A>> {
  return Schema.declaration(Vector(value), maybeParser(true), maybeParser(false)).annotate(
    ASTAnnotation.Identifier,
    `Maybe<${value.show()}>`,
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

function maybeParser(isDecoding: boolean) {
  return <A>(value: Schema<A>): Parser<Maybe<unknown>> => {
    const schema     = maybe(value);
    const parseValue = isDecoding ? value.decode : value.encode;
    return Parser.make((u, options) => {
      if (!Maybe.isMaybe(u)) {
        return ParseResult.fail(ParseError.TypeError(schema.ast, u));
      }
      Maybe.concrete(u);
      if (u.isNothing()) {
        return ParseResult.succeed(Nothing());
      } else {
        return parseValue(u.value, options).map((a) => Just(a));
      }
    });
  };
}
