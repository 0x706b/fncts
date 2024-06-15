import type { IndexError } from "@fncts/schema/ParseError";
import type { Sized } from "@fncts/test/control/Sized";

/**
 * @tsplus static fncts.schema.SchemaOps list
 * @tsplus getter fncts.Schema.Schema list
 */
export function list<A>(value: Schema<A>): Schema<List<A>> {
  return Schema.declaration(Vector(value), parser(true), parser(false))
    .annotate(ASTAnnotation.Identifier, `List<${value.show()}>`)
    .annotate(ASTAnnotation.GenHook, gen);
}

/**
 * @tsplus static fncts.schema.SchemaOps listFromArray
 * @tsplus getter fncts.Schema.Schema listFromArray
 */
export function listFromArray<A>(value: Schema<A>): Schema<List<A>> {
  return Schema.array(value).transform(
    list(value),
    (input) => List.from(input),
    (input) => Array.from(input),
  );
}

/**
 * @tsplus derive fncts.schema.Schema[fncts.List]<_> 10
 */
export function deriveList<A extends List<any>>(
  ...[value]: [A] extends [List<infer _A>]
    ? Check<Check.IsEqual<A, List<_A>>> extends Check.True
      ? [value: Schema<_A>]
      : never
    : never
): Schema<A> {
  return unsafeCoerce(listFromArray(value));
}

function parser(isDecoding: boolean) {
  return <A>(value: Schema<A>): Parser<List<unknown>> => {
    const schema     = list(value);
    const parseValue = isDecoding ? value.decode : value.encode;
    return Parser.make((u, options) => {
      if (!List.is(u)) {
        return ParseResult.fail(ParseError.TypeError(schema.ast, u));
      }
      const out       = new ListBuffer<unknown>();
      const errors    = Vector.emptyPushable<IndexError>();
      const allErrors = options?.allErrors;
      const index     = 0;
      for (const v of u) {
        const t = parseValue(v, options);
        Either.concrete(t);
        if (t.isLeft()) {
          errors.push(ParseError.IndexError(index, t.left));
          if (allErrors) {
            continue;
          }
          return ParseResult.fail(ParseError.IterableError(schema.ast, u, errors));
        } else {
          out.append(t.right);
        }
      }
      return errors.isNonEmpty()
        ? ParseResult.fail(ParseError.IterableError(schema.ast, u, errors))
        : ParseResult.succeed(out.toList);
    });
  };
}

function gen<A>(value: Gen<Sized, A>): Gen<Sized, List<A>> {
  return Gen.array(value).map((array) => List.from(array));
}
