import type { TemplateLiteral, TemplateLiteralSpan } from "@fncts/schema/AST";

import { globalValue } from "@fncts/base/data/Global";
import { ASTTag } from "@fncts/schema/AST";
import { ASTAnnotation } from "@fncts/schema/ASTAnnotation";
import { memoize } from "@fncts/schema/utils";

const showMemoMap = globalValue(Symbol.for("fncts.schema.Guard.showMemoMap"), () => new WeakMap<AST, Eval<string>>());

function goMemo(ast: AST): Eval<string> {
  const memo = showMemoMap.get(ast);
  if (memo) {
    return memo;
  }
  const s = go(ast);
  showMemoMap.set(ast, s);
  return s;
}

/**
 * @tsplus getter fncts.schema.Schema show
 */
export function show<A>(self: Schema<A>): string {
  const ev = goMemo(self.ast);
  return ev.run;
}

function go(ast: AST): Eval<string> {
  AST.concrete(ast);
  switch (ast._tag) {
    case ASTTag.Declaration: {
      return ast.annotations.get(ASTAnnotation.Identifier).match(
        () => Eval.now("Unknown Type"),
        (id) => {
          return ast.typeParameters
            .traverse(Eval.Applicative)(goMemo)
            .map((ts) => {
              if (ts.length <= 0) {
                return id;
              } else {
                return `${id}<${ts.join(", ")}>`;
              }
            });
        },
      );
    }
    case ASTTag.Literal: {
      if (ast.literal === null) {
        return Eval.now("null");
      } else {
        return Eval.now(ast.literal.toString());
      }
    }
    case ASTTag.UniqueSymbol:
      return Eval.now(ast.symbol.toString());
    case ASTTag.UndefinedKeyword:
      return Eval.now("undefined");
    case ASTTag.VoidKeyword:
      return Eval.now("void");
    case ASTTag.NeverKeyword:
      return Eval.now("never");
    case ASTTag.UnknownKeyword:
      return Eval.now("unknown");
    case ASTTag.AnyKeyword:
      return Eval.now("any");
    case ASTTag.StringKeyword:
      return Eval.now("string");
    case ASTTag.NumberKeyword:
      return Eval.now("number");
    case ASTTag.BooleanKeyword:
      return Eval.now("boolean");
    case ASTTag.BigIntKeyword:
      return Eval.now("bigint");
    case ASTTag.SymbolKeyword:
      return Eval.now("symbol");
    case ASTTag.ObjectKeyword:
      return Eval.now("object");
    case ASTTag.TemplateLiteral:
      return Eval.now("`" + formatTemplateLiteral(ast) + "`");
    case ASTTag.Tuple:
      return Do((Δ) => {
        const elements     = Δ(ast.elements.traverse(Eval.Applicative)((element) => goMemo(element.type)));
        const restElements = Δ(
          ast.rest.match(
            () => Eval.now(Vector.empty<string>()),
            (rest) => rest.traverse(Eval.Applicative)(goMemo),
          ),
        );

        return Δ(
          Eval(() => {
            if (elements.length === 0 && restElements.length === 1) {
              if (ast.isReadonly) {
                return `ReadonlyArray<${restElements[0]}>`;
              } else {
                return `Array<${restElements[0]}>`;
              }
            }

            const prefix = (ast.isReadonly ? "readonly " : "") + "[" + elements.join(", ");
            const middle = restElements.length > 0 ? ", " : "";
            const suffix = restElements.map((s) => `...${s}`).join(", ") + "]";
            return prefix + middle + suffix;
          }),
        );
      });
    case ASTTag.TypeLiteral:
      return Do((Δ) => {
        const propertySignatures = Δ(ast.propertySignatures.traverse(Eval.Applicative)((ps) => goMemo(ps.type)));
        const indexSignatures    = Δ(
          ast.indexSignatures.traverse(Eval.Applicative)((is) => goMemo(is.parameter).zip(goMemo(is.type))),
        );

        const required: Array<[PropertyKey, string]> = [];
        const optional: Array<[PropertyKey, string]> = [];

        ast.propertySignatures.forEachWithIndex((i, ps) => {
          const name = ps.name;
          if (!ps.isOptional) {
            required.push([name, propertySignatures[i]!]);
          } else {
            optional.push([name, propertySignatures[i]!]);
          }
        });

        const prefix     = "{";
        const properties = required
          .concat(optional)
          .sort(([k1], [k2]) => k1.toLocaleString().localeCompare(k2.toLocaleString()))
          .map(([propertyKey, type]) => `${String(propertyKey)}: ${type}`)
          .join(", ");
        const index  = indexSignatures.map(([param, type]) => `[x: ${param}]: ${type}`).join(", ");
        const suffix = "}";

        return prefix + " " + properties + (index.length === 0 ? "" : ", ") + index + " " + suffix;
      });
    case ASTTag.Union:
      return ast.types
        .traverse(Eval.Applicative)(goMemo)
        .map((ts) => ts.join(" | "));
    case ASTTag.Lazy: {
      const f   = () => goMemo(ast.getAST());
      const get = memoize<void, Eval<string>>(f);
      return Eval.defer(() => get());
    }
    case ASTTag.Enum: {
      return Eval.now(ast.enums.map(([name]) => name).join(" | "));
    }
    case ASTTag.Refinement: {
      return ast.annotations.get(ASTAnnotation.Identifier).match(
        () => goMemo(ast.from).map((from) => `Refined<${from}>`),
        (id) => Eval.now(id),
      );
    }
    case ASTTag.Transform:
      return goMemo(ast.to);
    case ASTTag.Validation: {
      return goMemo(ast.from).map((from) => {
        const validationNames = ast.validation.map((v) => v.name).join(" & ");

        if (validationNames.length <= 0) {
          return from;
        }

        return `${from} & ${validationNames}`;
      });
    }
  }
}

function formatTemplateLiteralSpan(span: TemplateLiteralSpan): string {
  switch (span.type._tag) {
    case ASTTag.StringKeyword:
      return "${string}";
    case ASTTag.NumberKeyword:
      return "${number}";
  }
}

function formatTemplateLiteral(ast: TemplateLiteral): string {
  return ast.head + ast.spans.map((span) => formatTemplateLiteralSpan(span) + span.literal).join("");
}
