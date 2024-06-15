import type { KeyError } from "@fncts/schema/ParseError";
import type { Sized } from "@fncts/test/control/Sized";

/**
 * @tsplus static fncts.schema.SchemaOps map
 */
export function map<K, V>(key: Schema<K>, value: Schema<V>): Schema<Map<K, V>> {
  return Schema.declaration(Vector(key, value), mapParser(true), mapParser(false))
    .annotate(ASTAnnotation.Identifier, `Map<${key.show()}, ${value.show()}>`)
    .annotate(ASTAnnotation.GenHook, gen);
}

/**
 * @tsplus static fncts.schema.SchemaOps mapFromRecord
 */
export function mapFromRecord<K extends string | symbol, V>(key: Schema<K>, value: Schema<V>): Schema<Map<K, V>> {
  return Schema.record(key, value).transform(
    map(key, value),
    (input) => {
      const out = new Map<K, V>();
      for (const [k, v] of Object.entries(input)) {
        out.set(k as K, v as V);
      }
      return out;
    },
    (input) => {
      const out = {} as Record<K, V>;
      input.forEach((v, k) => {
        out[k] = v;
      });
      return out;
    },
  );
}

/**
 * @tsplus derive fncts.schema.Schema[fncts.Map]<_> 10
 */
export function deriveMap<A extends Map<any, any>>(
  // @ts-expect-error
  ...[key, value]: [A] extends [Map<infer K, infer V>]
    ? Check<Check.IsEqual<A, Map<K, V>> & Check.Extends<K, string | symbol>> extends Check.True
      ? [key: Schema<K>, value: Schema<V>]
      : never
    : never
): Schema<A> {
  return unsafeCoerce(mapFromRecord(key as Schema<string | symbol>, value));
}

function mapParser(isDecoding: boolean) {
  return <K, V>(key: Schema<K>, value: Schema<V>): Parser<Map<unknown, unknown>> => {
    const schema = map(key, value);
    return Parser.make((u, options) => {
      if (!(u instanceof Map)) {
        return ParseResult.fail(ParseError.TypeError(schema.ast, u));
      }
      const allErrors   = options?.allErrors;
      const errors      = Vector.emptyPushable<KeyError>();
      const out         = new Map();
      const keyParser   = isDecoding ? key.decode : key.encode;
      const valueParser = isDecoding ? value.decode : value.encode;
      for (const [k, v] of u) {
        const tk = keyParser(k, options);
        Either.concrete(tk);
        if (tk.isLeft()) {
          errors.push(ParseError.KeyError(key.ast, k, tk.left));
          if (!allErrors) {
            return ParseResult.fail(ParseError.IterableError(schema.ast, u, errors));
          }
        }
        const tv = valueParser(v, options);
        Either.concrete(tv);
        if (tv.isLeft()) {
          errors.push(ParseError.KeyError(key.ast, k, ParseError.TypeError(value.ast, tv.left)));
          if (!allErrors) {
            return ParseResult.fail(ParseError.IterableError(schema.ast, u, errors));
          }
        }
        if (tk.isLeft() || tv.isLeft()) {
          continue;
        }
        out.set(tk.right, tv.right);
      }
      return errors.isNonEmpty()
        ? ParseResult.fail(ParseError.IterableError(schema.ast, u, errors))
        : ParseResult.succeed(out);
    });
  };
}

function gen<K, V>(key: Gen<Sized, K>, value: Gen<Sized, V>): Gen<Sized, Map<K, V>> {
  return Gen.array(Gen.tuple(key, value)).map((pairs) => new Map(pairs));
}
