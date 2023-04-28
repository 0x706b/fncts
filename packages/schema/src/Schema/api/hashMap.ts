import type {
  ArrayNode,
  CollisionNode,
  EmptyNode,
  IndexedNode,
  LeafNode,
  Node,
} from "@fncts/base/collection/immutable/HashMap/internal";
import type { Sized } from "@fncts/test/control/Sized";
import type { Check } from "@fncts/typelevel";

import { HashMap } from "@fncts/base/collection/immutable/HashMap";
import { HashMapTypeId, HashMapVariance } from "@fncts/base/collection/immutable/HashMap";
import { ASTAnnotation } from "@fncts/schema/ASTAnnotation";

/**
 * @tsplus static fncts.schema.SchemaOps hashMap
 */
export function hashMap<K, V>(key: Schema<K>, value: Schema<V>): Schema<HashMap<K, V>> {
  return Schema.declaration(
    Vector(key, value),
    inline(key, value),
    hashMapParser,
    ASTAnnotationMap.empty.annotate(ASTAnnotation.Identifier, "HashMap").annotate(ASTAnnotation.GenHook, gen),
  );
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

function hashMapParser<K, V>(key: Schema<K>, value: Schema<V>): Parser<HashMap<K, V>> {
  const schema = hashMap(key, value);
  return Parser.make((u, options) => {
    if (!HashMap.is(u)) {
      return ParseResult.fail(ParseError.TypeError(schema.ast, u));
    }
    const allErrors = options?.allErrors;
    const errors    = Vector.emptyPushable<ParseError>();
    const out       = HashMap.empty<K, V>().beginMutation;
    for (const [k, v] of u) {
      const tk = key.decode(k, options);
      Either.concrete(tk);
      if (tk.isLeft()) {
        errors.push(ParseError.KeyError(key.ast, k, tk.left));
        if (!allErrors) {
          return ParseResult.failures(errors);
        }
      }
      const tv = value.decode(v, options);
      Either.concrete(tv);
      if (tv.isLeft()) {
        errors.push(ParseError.TypeError(value.ast, tv.left));
        if (!allErrors) {
          return ParseResult.failures(errors);
        }
      }
      if (tk.isLeft() || tv.isLeft()) {
        continue;
      }
      out.set(tk.right, tv.right);
    }
    return errors.isNonEmpty() ? ParseResult.failures(errors) : ParseResult.succeed(out.endMutation);
  });
}

function emptyNodeSchema<K, V>(_key: Schema<K>, _value: Schema<V>): Schema<EmptyNode<K, V>> {
  return Schema.struct({
    _tag: Schema.literal("EmptyNode"),
    modify: Schema.any,
  });
}

function leafNodeSchema<K, V>(key: Schema<K>, value: Schema<V>): Schema<LeafNode<K, V>> {
  return Schema.struct({
    _tag: Schema.literal("LeafNode"),
    edit: Schema.number,
    hash: Schema.number,
    key,
    value: value.maybe,
    modify: Schema.any,
  });
}

function collisionNodeSchema<K, V>(key: Schema<K>, value: Schema<V>): Schema<CollisionNode<K, V>> {
  return Schema.lazy(() =>
    Schema.struct({
      _tag: Schema.literal("CollisionNode"),
      edit: Schema.number,
      hash: Schema.number,
      children: nodeSchema(key, value).mutableArray,
      modify: Schema.any,
    }),
  );
}

function indexedNodeSchema<K, V>(key: Schema<K>, value: Schema<V>): Schema<IndexedNode<K, V>> {
  return Schema.lazy(() =>
    Schema.struct({
      _tag: Schema.literal("IndexedNode"),
      edit: Schema.number,
      mask: Schema.number,
      children: nodeSchema(key, value).mutableArray,
      modify: Schema.any,
    }),
  );
}

function arrayNodeSchema<K, V>(key: Schema<K>, value: Schema<V>): Schema<ArrayNode<K, V>> {
  return Schema.lazy(() =>
    Schema.struct({
      _tag: Schema.literal("ArrayNode"),
      edit: Schema.number,
      size: Schema.number,
      children: nodeSchema(key, value).mutableArray,
      modify: Schema.any,
    }),
  );
}

function nodeSchema<K, V>(key: Schema<K>, value: Schema<V>): Schema<Node<K, V>> {
  return Schema.union(
    emptyNodeSchema(key, value),
    leafNodeSchema(key, value),
    collisionNodeSchema(key, value),
    indexedNodeSchema(key, value),
    arrayNodeSchema(key, value),
  );
}

function inline<K, V>(key: Schema<K>, value: Schema<V>): Schema<HashMap<K, V>> {
  return Schema.struct({
    [HashMapTypeId]: Schema.uniqueSymbol(HashMapTypeId),
    [HashMapVariance]: Schema.any,
    editable: Schema.boolean,
    edit: Schema.number,
    config: Schema.any,
    root: nodeSchema(key, value),
    size: Schema.number,
    [Symbol.iterator]: Schema.any,
    [Symbol.hash]: Schema.any,
    [Symbol.equals]: Schema.any,
  });
}

function gen<K, V>(key: Gen<Sized, K>, value: Gen<Sized, V>): Gen<Sized, HashMap<K, V>> {
  return Gen.array(Gen.tuple(key, value)).map((pairs) => HashMap.from(pairs));
}
