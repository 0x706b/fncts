import type { Sized } from "@fncts/test/control/Sized";

import {
  type ArrayNode,
  type CollisionNode,
  type EmptyNode,
  HashSetTypeId,
  HashSetVariance,
  type IndexedNode,
  type LeafNode,
  type Node,
} from "@fncts/base/collection/immutable/HashSet/definition";
import { ASTAnnotation } from "@fncts/schema/ASTAnnotation";
import { ASTAnnotationMap } from "@fncts/schema/ASTAnnotationMap";

export function hashSet<A>(value: Schema<A>): Schema<HashSet<A>> {
  return Schema.declaration(
    Vector(value),
    inline(value),
    hashSetParser,
    ASTAnnotationMap.empty.annotate(ASTAnnotation.Identifier, "HashMap").annotate(ASTAnnotation.GenHook, gen),
  );
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

function hashSetParser<A>(value: Schema<A>): Parser<HashSet<A>> {
  const schema = hashSet(value);
  return Parser.make((u, options) => {
    if (!HashSet.is(u)) {
      return ParseResult.fail(ParseError.TypeError(schema.ast, u));
    }
    const allErrors = options?.allErrors;
    const errors    = Vector.emptyPushable<ParseError>();
    const out       = HashSet.empty<A>().beginMutation;
    for (const v of u) {
      const tv = value.decode(v, options);
      Either.concrete(tv);
      if (tv.isLeft()) {
        errors.push(ParseError.TypeError(value.ast, tv.left));
        if (!allErrors) {
          return ParseResult.failures(errors);
        }
        continue;
      }
      out.add(tv.right);
    }
    return errors.isNonEmpty() ? ParseResult.failures(errors) : ParseResult.succeed(out.endMutation);
  });
}

function emptyNodeSchema<A>(_value: Schema<A>): Schema<EmptyNode<A>> {
  return Schema.struct({
    _tag: Schema.literal("EmptyNode"),
    modify: Schema.any,
  });
}

function leafNodeSchema<A>(value: Schema<A>): Schema<LeafNode<A>> {
  return Schema.struct({
    _tag: Schema.literal("LeafNode"),
    edit: Schema.number,
    hash: Schema.number,
    value: value,
    modify: Schema.any,
  });
}

function collisionNodeSchema<A>(value: Schema<A>): Schema<CollisionNode<A>> {
  return Schema.lazy(() =>
    Schema.struct({
      _tag: Schema.literal("CollisionNode"),
      edit: Schema.number,
      hash: Schema.number,
      children: nodeSchema(value).mutableArray,
      modify: Schema.any,
    }),
  );
}

function indexedNodeSchema<A>(value: Schema<A>): Schema<IndexedNode<A>> {
  return Schema.lazy(() =>
    Schema.struct({
      _tag: Schema.literal("IndexedNode"),
      edit: Schema.number,
      mask: Schema.number,
      children: nodeSchema(value).mutableArray,
      modify: Schema.any,
    }),
  );
}

function arrayNodeSchema<A>(value: Schema<A>): Schema<ArrayNode<A>> {
  return Schema.lazy(() =>
    Schema.struct({
      _tag: Schema.literal("ArrayNode"),
      edit: Schema.number,
      size: Schema.number,
      children: nodeSchema(value).mutableArray,
      modify: Schema.any,
    }),
  );
}

function nodeSchema<A>(value: Schema<A>): Schema<Node<A>> {
  return Schema.union(
    emptyNodeSchema(value),
    leafNodeSchema(value),
    collisionNodeSchema(value),
    indexedNodeSchema(value),
    arrayNodeSchema(value),
  );
}

function inline<A>(value: Schema<A>): Schema<HashSet<A>> {
  return Schema.struct({
    [HashSetTypeId]: Schema.uniqueSymbol(HashSetTypeId),
    [HashSetVariance]: Schema.any,
    _editable: Schema.boolean,
    _edit: Schema.number,
    config: Schema.any,
    _root: nodeSchema(value),
    _size: Schema.number,
    size: Schema.number,
    [Symbol.iterator]: Schema.any,
    [Symbol.hash]: Schema.any,
    [Symbol.equals]: Schema.any,
  });
}

function gen<A>(value: Gen<Sized, A>): Gen<Sized, HashSet<A>> {
  return Gen.array(value).map(HashSet.from);
}
