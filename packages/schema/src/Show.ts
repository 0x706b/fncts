import type {
  Element,
  Refinement,
  StringKeyword,
  SymbolKeyword,
  TemplateLiteral,
  TemplateLiteralSpan,
  Tuple,
  TypeLiteral,
} from "@fncts/schema/AST";

import { globalValue } from "@fncts/base/data/Global";
import { ASTTag } from "@fncts/schema/AST";
import { formatUnknown } from "@fncts/schema/utils";

const showMemoMap        = globalValue(Symbol.for("fncts.schema.Guard.showMemoMap"), () => new WeakMap<AST, string>());
const showMemoMapVerbose = globalValue(
  Symbol.for("fncts.schema.Guard.showMemoMapVerbose"),
  () => new WeakMap<AST, string>(),
);

function goMemo(ast: AST, verbose: boolean): string {
  const memoMap = verbose ? showMemoMapVerbose : showMemoMap;
  const memo    = memoMap.get(ast);
  if (memo) {
    return memo;
  }
  const s = go(ast, verbose);
  memoMap.set(ast, s);
  return s;
}

/**
 * @tsplus pipeable fncts.schema.Schema show
 */
export function show(verbose: boolean = false) {
  return <A>(self: Schema<A>): string => goMemo(self.ast, verbose);
}

/**
 * @tsplus pipeable fncts.schema.AST show
 */
export function showAST(verbose: boolean = false) {
  return (self: AST): string => goMemo(self, verbose);
}

function go(ast: AST, verbose: boolean): string {
  AST.concrete(ast);
  switch (ast._tag) {
    case ASTTag.Declaration: {
      return ast.getFormattedExpected(verbose).getOrElse("<declaration schema>");
    }
    case ASTTag.Literal:
      return ast.getFormattedExpected(verbose).getOrElse(formatUnknown(ast.literal));
    case ASTTag.UniqueSymbol:
      return ast.getFormattedExpected(verbose).getOrElse(formatUnknown(ast.symbol));
    case ASTTag.UndefinedKeyword:
      return ast.getFormattedExpected(verbose).getOrElse("undefined");
    case ASTTag.VoidKeyword:
      return ast.getFormattedExpected(verbose).getOrElse("void");
    case ASTTag.NeverKeyword:
      return ast.getFormattedExpected(verbose).getOrElse("never");
    case ASTTag.UnknownKeyword:
      return ast.getFormattedExpected(verbose).getOrElse("unknown");
    case ASTTag.AnyKeyword:
      return ast.getFormattedExpected(verbose).getOrElse("any");
    case ASTTag.StringKeyword:
      return ast.getFormattedExpected(verbose).getOrElse("string");
    case ASTTag.NumberKeyword:
      return ast.getFormattedExpected(verbose).getOrElse("number");
    case ASTTag.BooleanKeyword:
      return ast.getFormattedExpected(verbose).getOrElse("boolean");
    case ASTTag.BigIntKeyword:
      return ast.getFormattedExpected(verbose).getOrElse("bigint");
    case ASTTag.SymbolKeyword:
      return ast.getFormattedExpected(verbose).getOrElse("symbol");
    case ASTTag.ObjectKeyword:
      return ast.getFormattedExpected(verbose).getOrElse("object");
    case ASTTag.TemplateLiteral:
      return ast.getFormattedExpected(verbose).getOrElse(formatTemplateLiteral(ast));
    case ASTTag.Tuple: {
      return ast.getFormattedExpected(verbose).getOrElse(formatTuple(ast, verbose));
    }
    case ASTTag.TypeLiteral: {
      return ast.getFormattedExpected(verbose).getOrElse(formatTypeLiteral(ast, verbose));
    }
    case ASTTag.Union: {
      return ast.getFormattedExpected(verbose).getOrElse(ast.types.map((ast) => goMemo(ast, verbose)).join(" | "));
    }
    case ASTTag.Lazy: {
      return ast
        .getFormattedExpected(verbose)
        .orElse(Maybe.tryCatch(ast.getAST).flatMap((ast) => ast.getFormattedExpected(verbose)))
        .getOrElse("<lazy schema>");
    }
    case ASTTag.Enum: {
      return ast
        .getFormattedExpected(verbose)
        .getOrElse(
          `<enum ${ast.enums.length} values(s): ${ast.enums.map(([_, value]) => JSON.stringify(value)).join(" | ")}`,
        );
    }
    case ASTTag.Refinement: {
      return ast.getFormattedExpected(verbose).getOrElse(`{ ${goMemo(ast.from, verbose)} | filter }`);
    }
    case ASTTag.Transform: {
      return ast
        .getFormattedExpected(verbose)
        .getOrElse(`(${goMemo(ast.from, verbose)} <-> ${goMemo(ast.to, verbose)})`);
    }
    case ASTTag.Validation: {
      return ast
        .getFormattedExpected(verbose)
        .getOrElse(`${goMemo(ast.from, verbose)} (${ast.validation.map((v) => v.name).join(" & ")})`);
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
  return "`" + ast.head + ast.spans.map((span) => formatTemplateLiteralSpan(span) + span.literal).join("") + "`";
}

function formatElement(ast: Element, verbose: boolean): string {
  return goMemo(ast.type, verbose) + (ast.isOptional ? "?" : "");
}

function getParameterBase(
  self: StringKeyword | SymbolKeyword | TemplateLiteral | Refinement,
): StringKeyword | SymbolKeyword | TemplateLiteral {
  switch (self._tag) {
    case ASTTag.StringKeyword:
    case ASTTag.SymbolKeyword:
    case ASTTag.TemplateLiteral:
      return self;
    case ASTTag.Refinement:
      return getParameterBase(self);
  }
}

function formatTuple(ast: Tuple, verbose: boolean): string {
  const formattedElements = ast.elements.map((element) => formatElement(element, verbose)).join(", ");
  return ast.rest
    .filter((rest) => rest.isNonEmpty())
    .match(
      () => `${ast.isReadonly ? "readonly " : ""}[${formattedElements}]`,
      (rest) => {
        const head          = rest.unsafeHead!;
        const tail          = rest.tail;
        const formattedHead = goMemo(head, verbose);
        const wrappedHead   = formattedHead.includes(" | ") ? `(${formattedHead})` : formattedHead;

        if (tail.length > 0) {
          const formattedTail = tail.map((ast) => goMemo(ast, verbose)).join(", ");
          if (ast.elements.length > 0) {
            return `${ast.isReadonly ? "readonly " : " "}[${formattedElements}, ...${wrappedHead}[], ${formattedTail}]`;
          } else {
            return `${ast.isReadonly ? "readonly " : " "}[...${wrappedHead}[], ${formattedTail}]`;
          }
        } else {
          if (ast.elements.length > 0) {
            return `${ast.isReadonly ? "readonly " : " "}[${formattedElements}, ...${wrappedHead}[]]`;
          } else {
            return `${ast.isReadonly ? "Readonly" : ""}Array<${formattedHead}>`;
          }
        }
      },
    );
}

function formatTypeLiteral(ast: TypeLiteral, verbose: boolean): string {
  const formattedPropertySignatures = ast.propertySignatures
    .map(
      (ps) =>
        (ps.isReadonly ? "readonly " : "") +
        String(ps.name) +
        (ps.isOptional ? "?" : "") +
        ": " +
        goMemo(ps.type, verbose),
    )
    .join("; ");
  if (ast.indexSignatures.length > 0) {
    const formattedIndexSignatures = ast.indexSignatures
      .map(
        (is) =>
          (is.isReadonly ? "readonly " : "") +
          `[x: ${goMemo(getParameterBase(is.parameter), verbose)}]: ${goMemo(is.type, verbose)}`,
      )
      .join("; ");
    if (ast.propertySignatures.length > 0) {
      return `{ ${formattedPropertySignatures}; ${formattedIndexSignatures} }`;
    } else {
      return `{ ${formattedIndexSignatures} }`;
    }
  } else {
    if (ast.propertySignatures.length > 0) {
      return `{ ${formattedPropertySignatures} }`;
    } else {
      return "{}";
    }
  }
}
