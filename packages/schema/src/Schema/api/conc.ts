import type { IndexError } from "@fncts/schema/ParseError";
import type { Sized } from "@fncts/test/control/Sized";

export function conc<A>(value: Schema<A>): Schema<Conc<A>> {
  return Schema.declaration(Vector(value), concParser(true), concParser(false))
    .annotate(ASTAnnotation.Identifier, `Conc<${value.show()}>`)
    .annotate(ASTAnnotation.GenHook, gen);
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

function concParser(isDecoding: boolean) {
  return <A>(value: Schema<A>): Parser<Conc<unknown>> => {
    const schema = conc(value);
    return Parser.make((u, options) => {
      if (!Conc.is(u)) {
        return ParseResult.fail(ParseError.TypeError(schema.ast, u));
      }
      const allErrors           = options?.allErrors;
      const errors              = Vector.emptyPushable<IndexError>();
      const out: Array<unknown> = [];
      let i                     = 0;

      for (const v of u) {
        const parser = isDecoding ? value.decode : value.encode;
        const t      = parser(v, options);
        Either.concrete(t);
        if (t.isLeft()) {
          errors.push(ParseError.IndexError(i, t.left));
          if (!allErrors) {
            return ParseResult.fail(ParseError.IterableError(schema.ast, u, errors));
          }
        } else {
          out.push(t.right);
        }
        i++;
      }
      return errors.isNonEmpty()
        ? ParseResult.fail(ParseError.IterableError(schema.ast, u, errors))
        : ParseResult.succeed(Conc.from(out));
    });
  };
}

function gen<A>(value: Gen<Sized, A>): Gen<Sized, Conc<A>> {
  return Gen.conc(value);
}
