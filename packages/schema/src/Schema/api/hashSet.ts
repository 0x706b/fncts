import type { KeyError } from "@fncts/schema/ParseError";
import type { Sized } from "@fncts/test/control/Sized";

import { ASTAnnotation } from "@fncts/schema/ASTAnnotation";

export function hashSet<A>(value: Schema<A>): Schema<HashSet<A>> {
  return Schema.declaration(Vector(value), hashSetParser(true), hashSetParser(false))
    .annotate(ASTAnnotation.Identifier, `HashSet<${value.show()}>`)
    .annotate(ASTAnnotation.GenHook, gen);
}

/**
 * @tsplus static fncts.schema.SchemaOps hashSetFromArray
 */
export function hashSetFromArray<A>(value: Schema<A>): Schema<HashSet<A>> {
  return Schema.array(value).transform(
    hashSet(value),
    (input) => {
      const out = HashSet.empty<A>().beginMutation;
      for (const v of input) {
        out.add(v);
      }
      return out.endMutation;
    },
    (input) => {
      const out: Array<A> = [];
      input.forEach((v) => {
        out.push(v);
      });
      return out;
    },
  );
}

/**
 * @tsplus derive fncts.schema.Schema[fncts.HashSet]<_> 10
 */
export function deriveHashSet<A extends HashSet<any>>(
  ...[value]: [A] extends [HashSet<infer V>]
    ? Check<Check.IsEqual<A, HashSet<V>>> extends Check.True
      ? [value: Schema<V>]
      : never
    : never
): Schema<A> {
  return unsafeCoerce(hashSetFromArray(value));
}

function hashSetParser(isDecoding: boolean) {
  return <A>(value: Schema<A>): Parser<HashSet<unknown>> => {
    const schema     = hashSet(value);
    const parseValue = isDecoding ? value.decode : value.encode;
    return Parser.make((u, options) => {
      if (!HashSet.is(u)) {
        return ParseResult.fail(ParseError.TypeError(schema.ast, u));
      }

      const allErrors = options?.allErrors;
      const errors    = Vector.emptyPushable<KeyError>();
      const out       = HashSet.empty<unknown>().beginMutation;
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
        : ParseResult.succeed(out.endMutation);
    });
  };
}

function gen<A>(value: Gen<Sized, A>): Gen<Sized, HashSet<A>> {
  return Gen.array(value).map(HashSet.from);
}
