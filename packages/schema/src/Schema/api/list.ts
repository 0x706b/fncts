import type { Sized } from "@fncts/test/control/Sized";

import { ListTypeId } from "@fncts/base/collection/immutable/List";

/**
 * @tsplus static fncts.schema.SchemaOps list
 * @tsplus getter fncts.Schema.Schema list
 */
export function list<A>(value: Schema<A>): Schema<List<A>> {
  return Schema.declaration(
    Vector(value),
    inline(value),
    parser,
    ASTAnnotationMap.empty.annotate(ASTAnnotation.Identifier, "List").annotate(ASTAnnotation.GenHook, gen),
  );
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

function parser<A>(value: Schema<A>): Parser<List<A>> {
  const schema = list(value);
  return Parser.make((u, options) => {
    if (!List.is(u)) {
      return ParseResult.fail(ParseError.TypeError(schema.ast, u));
    }
    const out       = new ListBuffer<A>();
    const errors    = Vector.emptyPushable<ParseError>();
    const allErrors = options?.allErrors;
    const index     = 0;
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
        out.append(t.right);
      }
    }
    return errors.isNonEmpty() ? ParseResult.failures(errors) : ParseResult.succeed(out.toList);
  });
}

function nil<A>(_value: Schema<A>): Schema<Nil<A>> {
  return Schema.struct({
    _tag: Schema.literal("Nil"),
    [ListTypeId]: Schema.uniqueSymbol(ListTypeId),
    [Symbol.iterator]: Schema.any,
  });
}

function cons<A>(value: Schema<A>): Schema<Cons<A>> {
  return Schema.lazy(() =>
    Schema.struct({
      _tag: Schema.literal("Cons"),
      [ListTypeId]: Schema.uniqueSymbol(ListTypeId),
      [Symbol.iterator]: Schema.any,
      head: value,
      tail: inline(value),
    }),
  );
}

function inline<A>(value: Schema<A>): Schema<List<A>> {
  return Schema.lazy(() => Schema.union(nil(value), cons(value)));
}

function gen<A>(value: Gen<Sized, A>): Gen<Sized, List<A>> {
  return Gen.array(value).map((array) => List.from(array));
}
