import type { Sized } from "@fncts/test/control/Sized";

import {
  ImmutableArray,
  ImmutableArrayTypeId,
  ImmutableArrayVariance,
} from "@fncts/base/collection/immutable/ImmutableArray";
import { Vector } from "@fncts/base/collection/immutable/Vector";

/**
 * @tsplus getter fncts.schema.Schema immutableArray
 * @tsplus static fncts.schema.SchemaOps immutableArray
 */
export function immutableArray<A>(value: Schema<A>): Schema<ImmutableArray<A>> {
  return Schema.declaration(
    Vector(value),
    inline(value),
    parser,
    ASTAnnotationMap.empty.annotate(ASTAnnotation.Identifier, "ImmutableArray").annotate(ASTAnnotation.GenHook, gen),
  );
}

/**
 * @tsplus getter fncts.schema.Schema immutableArrayFromArray
 * @tsplus static fncts.schema.SchemaOps immutableArrayFromArray
 */
export function immutableArrayFromArray<A>(value: Schema<A>): Schema<ImmutableArray<A>> {
  return Schema.array(value).transform(
    immutableArray(value),
    (input) => new ImmutableArray(input),
    (input) => input._array,
  );
}

/**
 * @tsplus derive fncts.schema.Schema[fncts.ImmutableArray]<_> 10
 */
export function deriveImmutableArray<A extends ImmutableArray<any>>(
  ...[value]: [A] extends [ImmutableArray<infer _A>]
    ? Check<Check.IsEqual<A, ImmutableArray<_A>>> extends Check.True
      ? [value: Schema<_A>]
      : never
    : never
): Schema<A> {
  return unsafeCoerce(immutableArrayFromArray(value));
}

function parser<A>(value: Schema<A>): Parser<ImmutableArray<A>> {
  const schema = immutableArray(value);
  return Parser.make((u, options) => {
    if (!ImmutableArray.is(u)) {
      return ParseResult.fail(ParseError.TypeError(schema.ast, u));
    }
    const out: Array<A> = [];
    const errors        = Vector.emptyPushable<ParseError>();
    const allErrors     = options?.allErrors;
    const index         = 0;
    for (const v of u) {
      const t = value.decode(v, options);
      Either.concrete(t);
      if (t.isLeft()) {
        errors.push(ParseError.IndexError(index, t.left.errors));
        if (allErrors) {
          continue;
        }
        return ParseResult.failures(errors);
      } else {
        out.push(t.right);
      }
    }
    return errors.isNonEmpty() ? ParseResult.failures(errors) : ParseResult.succeed(new ImmutableArray(out));
  });
}

function inline<A>(value: Schema<A>): Schema<ImmutableArray<A>> {
  return Schema.struct({
    [ImmutableArrayTypeId]: Schema.uniqueSymbol(ImmutableArrayTypeId),
    [ImmutableArrayVariance]: Schema.any,
    _array: Schema.array(value),
    [Symbol.equals]: Schema.any,
    [Symbol.hash]: Schema.any,
    [Symbol.iterator]: Schema.any,
  });
}

function gen<A>(value: Gen<Sized, A>): Gen<Sized, ImmutableArray<A>> {
  return Gen.array(value).map((array) => new ImmutableArray(array));
}
