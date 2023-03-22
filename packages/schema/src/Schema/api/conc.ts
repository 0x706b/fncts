import type { Sized } from "@fncts/test/control/Sized";

import { ConcTypeId } from "@fncts/base/collection/immutable/Conc";

export function conc<A>(value: Schema<A>): Schema<Conc<A>> {
  return Schema.declaration(
    Vector(value),
    inline(value),
    concParser,
    ASTAnnotationMap.empty.annotate(ASTAnnotation.Identifier, "Conc").annotate(ASTAnnotation.GenHook, gen),
  );
}

/**
 * @tsplus static fncts.schema.SchemaOps concFromArray
 */
export function concFromArray<A>(value: Schema<A>): Schema<Conc<A>> {
  return Schema.array(value).transform(
    conc(value),
    (input) => Conc.fromArray(input),
    (input) => input.toArray,
  );
}

/**
 * @tsplus derive fncts.schema.Schema[fncts.Conc]<_> 10
 */
export function deriveConc<A extends Conc<any>>(
  ...[value]: [A] extends [Conc<infer _A>]
    ? Check<Check.IsEqual<A, Conc<_A>>> extends Check.True
      ? [value: Schema<_A>]
      : never
    : never
): Schema<A> {
  return unsafeCoerce(concFromArray(value));
}

export function concParser<A>(value: Schema<A>): Parser<Conc<A>> {
  const schema = conc(value);
  return Parser.make((u, options) => {
    if (!Conc.is(u)) {
      return ParseResult.fail(ParseError.TypeError(schema.ast, u));
    }
    const allErrors     = options?.allErrors;
    const errors        = Vector.emptyPushable<ParseError>();
    const out: Array<A> = [];
    let i               = 0;
    for (const v of u) {
      const t = value.decode(u);
      Either.concrete(t);
      if (t.isLeft()) {
        errors.push(ParseError.IndexError(i, t.left));
        if (!allErrors) {
          return ParseResult.failures(errors);
        }
      } else {
        out.push(t.right);
      }
      i++;
    }
    return errors.isNonEmpty() ? ParseResult.failures(errors) : ParseResult.succeed(Conc.fromArray(out));
  });
}

function inline<A>(_value: Schema<A>): Schema<Conc<A>> {
  return Schema.struct({
    _A: Schema.any,
    [ConcTypeId]: Schema.uniqueSymbol(ConcTypeId),
    length: Schema.number,
    [Symbol.iterator]: Schema.any,
    [Symbol.hash]: Schema.any,
    [Symbol.equals]: Schema.any,
  });
}

function gen<A>(value: Gen<Sized, A>): Gen<Sized, Conc<A>> {
  return Gen.conc(value);
}
