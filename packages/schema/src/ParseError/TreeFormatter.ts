import type {
  IndexError,
  KeyError,
  MissingError,
  RefinementError,
  TransformationError,
  TypeError,
  UnexpectedError,
} from "./ParseError";

import { showWithOptions } from "@fncts/base/data/Showable";

import { ParseErrorTag } from "./ParseError.js";

/**
 * @tsplus static fncts.schema.ParseErrorOps drawTree
 * @tsplus getter fncts.schema.ParseError drawTree
 */
export function format(error: ParseError): string {
  return go(error).draw;
}

function formatActual(actual: unknown): string {
  return showWithOptions(actual, { colors: false });
}

function formatRefinementKind(error: RefinementError): string {
  switch (error.kind) {
    case "From": {
      return "From side refinement failure";
    }
    case "Predicate": {
      return "Predicate refinement failure";
    }
  }
}

function formatTransformationKind(error: TransformationError): string {
  switch (error.kind) {
    case "Encoded": {
      return "Encoded side transformation failure";
    }
    case "Transformation": {
      return "Transformation process failure";
    }
    case "Type": {
      return "Type side transformation failure";
    }
  }
}

export function getMessage(error: ParseError): Maybe<string> {
  return error.ast.annotations.get(ASTAnnotation.Message).map((f) => f(error));
}

export function formatTypeError(error: TypeError): string {
  return getMessage(error).getOrElse(`Expected ${error.ast.toString(true)}, actual ${formatActual(error.actual)}`);
}

function formatKeyErrors(errors: Vector<KeyError | IndexError>): Vector<RoseTree<string>> {
  return errors.map((error) => {
    if (error._tag === ParseErrorTag.Key) {
      return RoseTree(`[${String(error.keyAST)}]`, Vector(go(error.error)));
    } else {
      return RoseTree(`[${error.index}]`, Vector(go(error.error)));
    }
  });
}

function getRoseTree(error: ParseError, orElse: Lazy<RoseTree<string>>) {
  return getMessage(error).match(
    () => orElse(),
    (message) => RoseTree(message),
  );
}

function go(error: ParseError | MissingError | UnexpectedError): RoseTree<string> {
  switch (error._tag) {
    case ParseErrorTag.Type:
      return RoseTree(formatTypeError(error));
    case ParseErrorTag.Declaration:
      return getRoseTree(error, () => {
        const shouldSkipDefaultMessage = error.error._tag === ParseErrorTag.Type && error.error.ast === error.ast;
        if (shouldSkipDefaultMessage) {
          return go(error.error);
        } else {
          return RoseTree(error.ast.toString(true), Vector(go(error.error)));
        }
      });
    case ParseErrorTag.Unexpected:
      return RoseTree("is unexpected");
    case ParseErrorTag.Missing:
      return RoseTree("is missing");
    case ParseErrorTag.TypeLiteral:
      return getRoseTree(error, () => {
        return RoseTree(error.ast.toString(true), formatKeyErrors(error.errors));
      });
    case ParseErrorTag.Tuple:
      return getRoseTree(error, () => {
        return RoseTree(error.ast.toString(true), formatKeyErrors(error.errors));
      });
    case ParseErrorTag.Union:
      return RoseTree(
        error.ast.toString(true),
        error.errors.map((error) => {
          switch (error._tag) {
            case ParseErrorTag.UnionMember:
              return RoseTree("Union member", Vector(go(error.error)));
            default:
              return go(error);
          }
        }),
      );
    case ParseErrorTag.Refinement:
      return getRoseTree(error, () => {
        return RoseTree(formatRefinementKind(error), Vector(go(error.error)));
      });
    case ParseErrorTag.Transformation:
      return getRoseTree(error, () => {
        return RoseTree(formatTransformationKind(error), Vector(go(error.error)));
      });
    case ParseErrorTag.Iterable:
      return getRoseTree(error, () => {
        return RoseTree(error.ast.toString(true), formatKeyErrors(error.errors));
      });
  }
}
