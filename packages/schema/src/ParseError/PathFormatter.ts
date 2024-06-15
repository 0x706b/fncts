import type { MissingError, UnexpectedError } from "./ParseError";

import { ParseErrorTag } from "./ParseError.js";
import { formatTypeError, getMessage } from "./TreeFormatter.js";

export interface ParseErrorFlat {
  type: ParseErrorTag;
  path: Array<string | number | symbol>;
  message: string;
}

/**
 * @tsplus getter fncts.schema.ParseError flatten
 */
export function flatten(error: ParseError): Array<ParseErrorFlat> {
  return go(error, []);

  function go(error: ParseError | MissingError | UnexpectedError, path: Array<PropertyKey>): Array<ParseErrorFlat> {
    switch (error._tag) {
      case ParseErrorTag.Tuple: {
        return getFlattenedParseError(
          error,
          path,
          error.errors.flatMap((error) => go(error.error, path.concat(error.index))).toArray,
        );
      }
      case ParseErrorTag.Union: {
        return getFlattenedParseError(
          error,
          path,

          error.errors.flatMap((error) => {
            if (error._tag === ParseErrorTag.UnionMember) {
              return go(error.error, path);
            } else {
              return go(error, path);
            }
          }).toArray,
        );
      }
      case ParseErrorTag.TypeLiteral: {
        return getFlattenedParseError(
          error,
          path,
          error.errors.flatMap((key) => go(key.error, path.concat(key.key))).toArray,
        );
      }
      case ParseErrorTag.Missing: {
        return [
          {
            type: error._tag,
            path: path,
            message: "is missing",
          } as const,
        ];
      }
      case ParseErrorTag.Unexpected: {
        return [
          {
            type: error._tag,
            path: path,
            message: "is unexpected",
          } as const,
        ];
      }
      case ParseErrorTag.Type: {
        return [
          {
            type: error._tag,
            path: path,
            message: formatTypeError(error),
          } as const,
        ];
      }
      case ParseErrorTag.Declaration:
      case ParseErrorTag.Transformation:
      case ParseErrorTag.Refinement: {
        return getFlattenedParseError(error, path, go(error.error, path));
      }
      case ParseErrorTag.Iterable: {
        return getFlattenedParseError(
          error,
          path,
          error.errors.flatMap((error) => {
            switch (error._tag) {
              case ParseErrorTag.Key: {
                return go(error.error, path.concat(error.key));
              }
              case ParseErrorTag.Index: {
                return go(error.error, path.concat(error.index));
              }
            }
          }).toArray,
        );
      }
    }
  }
}

function getFlattenedParseError(
  error: ParseError,
  path: Array<PropertyKey>,
  orElse: Lazy<Array<ParseErrorFlat>>,
): Array<ParseErrorFlat> {
  return getMessage(error).match(
    () => orElse(),
    (message) => {
      return [
        {
          type: error._tag,
          path,
          message,
        },
      ];
    },
  );
}
