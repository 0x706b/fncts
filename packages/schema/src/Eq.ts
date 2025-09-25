import { globalValue } from "@fncts/base/data/Global";

import { ASTTag } from "./AST.js";
import { getKeysForIndexSignature, memoize } from "./utils.js";

/**
 * @tsplus getter fncts.schema.Schema equals
 */
export function equals<A>(self: Schema<A>): (a: A, b: A) => boolean {
  const eq = self.eq;
  return (a, b) => eq.equals(b)(a);
}

/**
 * @tsplus getter fncts.schema.Schema eq
 */
export function eq<A>(self: Schema<A>): Eq<A> {
  return goMemo(self.ast);
}

const eqMemoMap = globalValue(Symbol.for("fncts.schema.Eq.eqMemoMap"), () => new WeakMap<AST, Eq<any>>());

function goMemo(ast: AST): Eq<any> {
  const memo = eqMemoMap.get(ast);
  if (memo) {
    return memo;
  }
  const eq = go(ast);
  eqMemoMap.set(ast, eq);
  return eq;
}

function go(ast: AST): Eq<any> {
  AST.concrete(ast);
  switch (ast._tag) {
    case ASTTag.Declaration:
      return ast.annotations
        .get(ASTAnnotation.EqHook)
        .map((eq) => eq(...ast.typeParameters.map(go)))
        .getOrElse(Eq.strict);
    case ASTTag.Literal:
    case ASTTag.UniqueSymbol:
    case ASTTag.UndefinedKeyword:
    case ASTTag.VoidKeyword:
    case ASTTag.UnknownKeyword:
    case ASTTag.AnyKeyword:
    case ASTTag.NumberKeyword:
    case ASTTag.BooleanKeyword:
    case ASTTag.BigIntKeyword:
    case ASTTag.SymbolKeyword:
    case ASTTag.ObjectKeyword:
    case ASTTag.TemplateLiteral:
    case ASTTag.StringKeyword:
      return Eq.strict;
    case ASTTag.NeverKeyword:
      return Eq.never as Eq<any>;
    case ASTTag.Tuple: {
      const elements = ast.elements.map((element) => goMemo(element.type));
      const rest     = ast.rest.map((rest) => rest.map((ast) => goMemo(ast)));
      return Eq<Array<any>>({
        equals: (y) => (x) => {
          if (x.length !== y.length) {
            return false;
          }

          let i = 0;

          for (; i < elements.length; i++) {
            const eq = elements[i]!;
            const xi = x[i];
            const yi = y[i];
            if (!eq.equals(yi)(xi)) {
              return false;
            }
          }

          if (rest.isJust()) {
            const head = rest.value.unsafeHead!;
            const tail = rest.value.tail;
            for (; i < x.length - tail.length; i++) {
              if (!head.equals(y[i])(x[i])) {
                return false;
              }
            }
            for (let j = 0; j < tail.length; j++) {
              i       += j;
              const eq = elements[i]!;
              const xi = x[i];
              const yi = y[i];
              if (!eq.equals(yi)(xi)) {
                return false;
              }
            }
          }

          return true;
        },
      });
    }
    case ASTTag.TypeLiteral: {
      const propertySignatureTypes = ast.propertySignatures.map((ps) => go(ps.type));
      const indexSignatures        = ast.indexSignatures.map((is) => [go(is.parameter), go(is.type)] as const);
      const requiredEqs: Record<PropertyKey, Eq<any>> = {};
      const optionalEqs: Record<PropertyKey, Eq<any>> = {};
      for (let i = 0; i < propertySignatureTypes.length; i++) {
        const ps   = ast.propertySignatures[i]!;
        const name = ps.name;
        if (!ps.isOptional) {
          requiredEqs[name] = propertySignatureTypes[i]!;
        } else {
          optionalEqs[name] = propertySignatureTypes[i]!;
        }
      }
      let output = Eq.struct(requiredEqs, optionalEqs);

      for (let i = 0; i < indexSignatures.length; i++) {
        const [, type] = indexSignatures[i]!;

        output = output.intersection(
          Eq<Record<PropertyKey, any>>({
            equals: (y) => (x) => {
              for (const key of getKeysForIndexSignature(x, ast.indexSignatures[i]!.parameter)) {
                if (key in requiredEqs || key in optionalEqs) {
                  continue;
                }
                if (!type.equals(y[key])(x[key])) {
                  return false;
                }
              }

              return true;
            },
          }),
        );
      }
      return output;
    }
    case ASTTag.Union:
      return Eq.union(ast.types.map(goMemo).toArray);
    case ASTTag.Lazy: {
      const f   = () => goMemo(ast.getAST());
      const get = memoize<typeof f, Eq<any>>(f);
      return Eq({
        equals: (y) => (x) => get(f).equals(y)(x),
      });
    }
    case ASTTag.Enum:
      return Eq.strict;
    case ASTTag.Transform:
      return goMemo(ast.to);
    case ASTTag.Refinement:
      return goMemo(ast.from);
    case ASTTag.Validation:
      return goMemo(ast.from);
  }
}
