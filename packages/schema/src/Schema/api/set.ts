import type { KeyError } from "@fncts/schema/ParseError";
import type { Sized } from "@fncts/test/control/Sized";

/**
 * @tsplus static fncts.schema.SchemaOps map
 */
export function set<V>(value: Schema<V>): Schema<Set<V>> {
  return Schema.declaration(Vector(value), setParser(true), setParser(false))
    .annotate(ASTAnnotation.Identifier, `Set<${value.show()}>`)
    .annotate(ASTAnnotation.GenHook, gen);
}

/**
 * @tsplus static fncts.schema.SchemaOps mapFromRecord
 */
export function setFromArray<V>(value: Schema<V>): Schema<Set<V>> {
  return Schema.array(value).transform(
    set(value),
    (input) => {
      return new Set(input);
    },
    (input) => {
      return Array.from(input);
    },
  );
}

/**
 * @tsplus derive fncts.schema.Schema[fncts.Set]<_> 10
 */
export function deriveSet<A extends Set<any>>(
  ...[value]: [A] extends [Set<infer V>]
    ? Check<Check.IsEqual<A, Set<V>>> extends Check.True
      ? [value: Schema<V>]
      : never
    : never
): Schema<A> {
  return unsafeCoerce(setFromArray(value));
}

function setParser(isDecoding: boolean) {
  return <A>(value: Schema<A>): Parser<Set<unknown>> => {
    const schema     = set(value);
    const parseValue = isDecoding ? value.decode : value.encode;
    return Parser.make((u, options) => {
      if (!(u instanceof Set)) {
        return ParseResult.fail(ParseError.TypeError(schema.ast, u));
      }

      const allErrors = options?.allErrors;
      const errors    = Vector.emptyPushable<KeyError>();
      const out       = new Set();
      for (const v of u) {
        const tv = parseValue(v, options);
        Either.concrete(tv);
        if (tv.isLeft()) {
          errors.push(ParseError.KeyError(value.ast, value, tv.left));
          if (!allErrors) {
            return ParseResult.fail(ParseError.IterableError(schema.ast, u, errors));
          }
          continue;
        }
        out.add(tv.right);
      }
      return errors.isNonEmpty()
        ? ParseResult.fail(ParseError.IterableError(schema.ast, u, errors))
        : ParseResult.succeed(out);
    });
  };
}

function gen<V>(value: Gen<Sized, V>): Gen<Sized, Set<V>> {
  return Gen.array(value).map((values) => new Set(values));
}
