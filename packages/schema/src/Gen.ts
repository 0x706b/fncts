import type { Hook } from "@fncts/schema/ASTAnnotation";
import type { Sized } from "@fncts/test/control/Sized";

import { ASTTag } from "@fncts/schema/AST";
import { ASTAnnotation } from "@fncts/schema/ASTAnnotation";
import { InvalidInterpretationError } from "@fncts/schema/InvalidInterpretationError";
import { memoize } from "@fncts/schema/utils";

/**
 * @tsplus getter fncts.schema.Schema genFrom
 */
export function genFrom<A>(self: Schema<A>): Gen<Sized, unknown> {
  return go(self.ast.getFrom);
}

/**
 * @tsplus getter fncts.schema.Schema genTo
 */
export function genTo<A>(self: Schema<A>): Gen<Sized, A> {
  return go(self.ast);
}

function getHook(ast: AST): Maybe<Hook<Gen<Sized, any>>> {
  return ast.annotations.get(ASTAnnotation.GenHook);
}

function record<K extends PropertyKey, V>(
  key: Gen<Sized, K>,
  value: Gen<Sized, V>,
): Gen<Sized, { readonly [k in K]: V }> {
  return Gen.tuple(key, value)
    .arrayWith({ maxLength: 10 })
    .map((tuples) => {
      const out: { [k in K]: V } = {} as any;
      for (const [k, v] of tuples) {
        out[k] = v;
      }
      return out;
    });
}

const go = memoize(function go(ast: AST): Gen<Sized, any> {
  AST.concrete(ast);
  switch (ast._tag) {
    case ASTTag.Declaration:
      return getHook(ast).match(
        () => go(ast.type),
        (hook) => hook(...ast.typeParameters.map(go)),
      );
    case ASTTag.Literal:
      return Gen.constant(ast.literal);
    case ASTTag.UniqueSymbol:
      return Gen.constant(ast.symbol);
    case ASTTag.UndefinedKeyword:
      return Gen.constant(undefined);
    case ASTTag.VoidKeyword:
      return Gen.constant(undefined);
    case ASTTag.NeverKeyword:
      return Gen.fromIO(IO.haltNow(new InvalidInterpretationError("cannot build a Gen for `never`")));
    case ASTTag.UnknownKeyword:
      // TODO: Gen.anything
      return Gen.constant("unknown");
    case ASTTag.AnyKeyword:
      // TODO: Gen.anything
      return Gen.constant("any");
    case ASTTag.StringKeyword:
      return Gen.fullUnicodeString();
    case ASTTag.NumberKeyword:
      return Gen.float;
    case ASTTag.BooleanKeyword:
      return Gen.boolean;
    case ASTTag.BigIntKeyword:
      return Gen.bigInt;
    case ASTTag.SymbolKeyword:
      return Gen.fullUnicodeString().map((s) => Symbol.for(s));
    case ASTTag.ObjectKeyword:
      // TODO: Gen.anything
      return Gen.constant({});
    case ASTTag.TemplateLiteral: {
      const components: Array<Gen<Sized, string>> = [Gen.constant(ast.head)];
      for (const span of ast.spans) {
        components.push(Gen.fullUnicodeString({ maxLength: 5 }));
        components.push(Gen.constant(span.literal));
      }
      return Gen.tuple(...components).map((spans) => spans.join(""));
    }
    case ASTTag.Tuple: {
      const elements = ast.elements.map((e) => go(e.type));
      const rest     = ast.rest.map((restElement) => restElement.map(go));
      let output     = Gen.tuple(...elements);
      if (elements.length > 0 && rest.isNothing()) {
        const firstOptionalIndex = ast.elements.findIndex((e) => e.isOptional);
        if (firstOptionalIndex !== -1) {
          output = output.flatMap((as) =>
            Gen.intWith({ min: firstOptionalIndex, max: elements.length - 1 }).map((i) => as.slice(0, i)),
          );
        }
      }
      if (rest.isJust()) {
        const head = rest.value.unsafeHead!;
        const tail = rest.value.tail;
        output     = output.flatMap((as) => head.arrayWith({ maxLength: 5 }).map((rest) => [...as, ...rest]));
        for (let j = 0; j < tail.length; j++) {
          output = output.flatMap((as) => tail[j]!.map((a) => [...as, a]));
        }
      }
      return output as Gen<Sized, any>;
    }
    case ASTTag.TypeLiteral: {
      const propertySignatureTypes = ast.propertySignatures.map((ps) => go(ps.type));
      const indexSignatures        = ast.indexSignatures.map((is) => [go(is.parameter), go(is.type)] as const);
      const gens: any              = {};
      const requiredGens: Record<PropertyKey, Gen<any, any>> = {};
      const optionalGens: Record<PropertyKey, Gen<any, any>> = {};
      for (let i = 0; i < propertySignatureTypes.length; i++) {
        const ps   = ast.propertySignatures[i]!;
        const name = ps.name;
        if (!ps.isOptional) {
          requiredGens[name] = propertySignatureTypes[i]!;
        } else {
          optionalGens[name] = propertySignatureTypes[i]!;
        }
      }
      let output = Gen.struct(requiredGens).zipWith(Gen.partial(optionalGens), (a, b) => ({ ...a, ...b }));
      for (let i = 0; i < indexSignatures.length; i++) {
        const parameter = indexSignatures[i]![0]!;
        const type      = indexSignatures[i]![1]!;
        output          = output.flatMap((o) => {
          return record(parameter, type).map((d) => ({ ...d, ...o }));
        });
      }
      return output;
    }
    case ASTTag.Union: {
      const types = ast.types.map(go);
      return Gen.oneOf(...types) as Gen<Sized, any>;
    }
    case ASTTag.Lazy: {
      return getHook(ast).match(
        () => {
          const f   = () => go(ast.getAST());
          const get = memoize<typeof f, Gen<any, any>>(f);
          return Gen.defer(() => get(f));
        },
        (handler) => handler(),
      );
    }
    case ASTTag.Enum: {
      if (ast.enums.length === 0) {
        return Gen.fromIO(IO.haltNow(new InvalidInterpretationError("cannot build a Gen for an empty enum")));
      }
      return Gen.oneOf(...ast.enums.map(([_, value]) => Gen.constant(value))) as Gen<Sized, any>;
    }
    case ASTTag.Refinement: {
      const from = go(ast.from);
      return getHook(ast).match(
        () => from.filter((a) => ast.decode(a).isRight()),
        (handler) => handler(from),
      );
    }
    case ASTTag.Transform:
      return go(ast.to);
    case ASTTag.Validation: {
      const from = go(ast.from);
      return getHook(ast).match(
        () => from.filter((a) => ast.validation.every((v) => v.validate(a))),
        (handler) => handler(from),
      );
    }
  }
});
