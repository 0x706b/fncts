import type { Sized } from "@fncts/test/control/Sized";

import { ImmutableArray } from "@fncts/base/collection/immutable/ImmutableArray";
import { Vector } from "@fncts/base/collection/immutable/Vector";

/**
 * @tsplus getter fncts.schema.Schema immutableArray
 * @tsplus static fncts.schema.SchemaOps immutableArray
 */
export function immutableArray<A>(value: Schema<A>): Schema<ImmutableArray<A>> {
  return Schema.declaration(Vector(value), parser(true), parser(false))
    .annotate(ASTAnnotation.Identifier, `ImmutableArray<${value.show()}>`)
    .annotate(ASTAnnotation.GenHook, gen);
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

function parser(isDecoding: boolean) {
  return <A>(value: Schema<A>): Parser<ImmutableArray<unknown>> => {
    const schema      = immutableArray(value);
    const arraySchema = value.array;
    const parse       = isDecoding ? arraySchema.decode : arraySchema.encode;
    return Parser.make((u, options) => {
      if (!ImmutableArray.is(u)) {
        return ParseResult.fail(ParseError.TypeError(schema.ast, u));
      }

      return parse(u, options).map((out) => new ImmutableArray(out as Array<unknown>));
    });
  };
}

function gen<A>(value: Gen<Sized, A>): Gen<Sized, ImmutableArray<A>> {
  return Gen.array(value).map((array) => new ImmutableArray(array));
}
