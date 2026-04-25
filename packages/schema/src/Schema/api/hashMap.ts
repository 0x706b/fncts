import type { KeyError } from "@fncts/schema/ParseError";
import type { Sized } from "@fncts/test/control/Sized";
import type { Check } from "@fncts/typelevel";

import { HashMap } from "@fncts/base/collection/immutable/HashMap";
import { ASTAnnotation } from "@fncts/schema/ASTAnnotation";

/**
 * @tsplus static fncts.schema.SchemaOps hashMap
 */
export function hashMap<K, V>(key: Schema<K>, value: Schema<V>): Schema<HashMap<K, V>> {
  return Schema.declaration(Vector(key, value), hashMapParser(true), hashMapParser(false))
    .annotate(ASTAnnotation.Identifier, `HashMap<${key.show()}, ${value.show()}>`)
    .annotate(ASTAnnotation.GenHook, gen);
}

/**
 * @tsplus static fncts.schema.SchemaOps hashMapFromRecord
 */
export function hashMapFromRecord<K extends string | symbol, V>(
  key: Schema<K>,
  value: Schema<V>,
): Schema<HashMap<K, V>> {
  return Schema.record(key, value).transform(
    hashMap(key, value),
    (input) => {
      const out = HashMap.empty<K, V>().beginMutation;
      for (const [k, v] of Object.entries(input)) {
        out.set(k as K, v as V);
      }
      return out.endMutation;
    },
    (input) => {
      const out = {} as Record<K, V>;
      input.forEachWithIndex((k, v) => {
        out[k] = v;
      });
      return out;
    },
  );
}

/**
 * @tsplus derive fncts.schema.Schema[fncts.HashMap]<_> 10
 */
export function deriveHashMap<A extends HashMap<any, any>>(
  // @ts-expect-error
  ...[key, value]: [A] extends [HashMap<infer K, infer V>]
    ? Check<Check.IsEqual<A, HashMap<K, V>> & Check.Extends<K, string | symbol>> extends Check.True
      ? [key: Schema<K>, value: Schema<V>]
      : never
    : never
): Schema<A> {
  return unsafeCoerce(hashMapFromRecord(key as Schema<string | symbol>, value));
}

function hashMapParser(isDecoding: boolean) {
  return <K, V>(key: Schema<K>, value: Schema<V>): Parser<HashMap<unknown, unknown>> => {
    const schema = hashMap(key, value);
    return Parser.make((u, options) => {
      if (!HashMap.is(u)) {
        return ParseResult.fail(ParseError.TypeError(schema.ast, u));
      }
      const allErrors   = options?.allErrors;
      const errors      = Vector.emptyPushable<KeyError>();
      const out         = HashMap.empty<unknown, unknown>().beginMutation;
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
          errors.push(ParseError.KeyError(key.ast, k, tv.left));
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
        : ParseResult.succeed(out.endMutation);
    });
  };
}

function gen<K, V>(key: Gen<Sized, K>, value: Gen<Sized, V>): Gen<Sized, HashMap<K, V>> {
  return Gen.array(Gen.tuple(key, value)).map((pairs) => HashMap.from(pairs));
}
