import type { EitherJson } from "@fncts/base/json/EitherJson";

import { EitherTypeId, EitherVariance } from "@fncts/base/data/Either";

/**
 * @tsplus static fncts.schema.SchemaOps either
 */
export function either<E, A>(left: Schema<E>, right: Schema<A>): Schema<Either<E, A>> {
  return Schema.declaration(
    Vector(left, right),
    eitherInline(left, right),
    eitherParser,
    ASTAnnotationMap.empty.annotate(ASTAnnotation.Identifier, "Either"),
  );
}

function eitherJson<E, A>(left: Schema<E>, right: Schema<A>): Schema<EitherJson<E, A>> {
  return Schema.union(
    Schema.struct({
      _tag: Schema.literal("Left"),
      left,
    }),
    Schema.struct({
      _tag: Schema.literal("Right"),
      right,
    }),
  );
}

/**
 * @tsplus static fncts.schema.SchemaOps eitherFromJson
 */
export function eitherFromJson<E, A>(left: Schema<E>, right: Schema<A>): Schema<Either<E, A>> {
  return eitherJson(left, right).transform(
    either(left, right),
    (input) => {
      if (input._tag === "Left") {
        return Either.left(input.left);
      } else {
        return Either.right(input.right);
      }
    },
    (input) => {
      Either.concrete(input);
      if (input.isLeft()) {
        return {
          _tag: "Left",
          left: input.left,
        } as const;
      } else {
        return {
          _tag: "Right",
          right: input.right,
        } as const;
      }
    },
  );
}

/**
 * @tsplus derive fncts.schema.Schema[fncts.Either]<_> 10
 */
export function deriveEither<A extends Either<any, any>>(
  ...[left, right]: [A] extends [Either<infer _E, infer _A>]
    ? Check<Check.IsEqual<A, Either<_E, _A>>> extends Check.True
      ? [left: Schema<_E>, right: Schema<_A>]
      : never
    : never
): Schema<A> {
  return unsafeCoerce(eitherFromJson(left, right));
}

function eitherParser<E, A>(left: Schema<E>, right: Schema<A>): Parser<Either<E, A>> {
  const schema = either(left, right);
  return Parser.make((u, options) => {
    if (!Either.isEither(u)) {
      return ParseResult.fail(ParseError.TypeError(schema.ast, u));
    }
    Either.concrete(u);
    if (u.isLeft()) {
      return left.decode(u.left, options).map(Either.left);
    } else {
      return right.decode(u.right, options).map(Either.right);
    }
  });
}

function eitherInline<E, A>(_left: Schema<E>, _right: Schema<A>): Schema<Either<E, A>> {
  return Schema.struct({
    [EitherTypeId]: Schema.uniqueSymbol(EitherTypeId),
    [EitherVariance]: Schema.any,
  });
}
