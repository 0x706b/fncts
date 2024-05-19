import type { MutableVector } from "@fncts/base/collection/immutable/Vector";
import type { Validation } from "@fncts/base/data/Branded";

import { globalValue } from "@fncts/base/data/Global";
import {
  isBigInt,
  isBoolean,
  isNumber,
  isObject,
  isRecord,
  isString,
  isSymbol,
  isUndefined,
} from "@fncts/base/util/predicates";

import { ASTTag, concrete, getSearchTree } from "../AST.js";
import { RefinementError, TransformationError } from "../ParseError.js";
import { getKeysForIndexSignature, getTemplateLiteralRegex, memoize, ownKeys } from "../utils.js";

const decodeMemoMap = globalValue(
  Symbol.for("fncts.schema.Parser.decodeMemoMap"),
  () => new WeakMap<AST, Parser<any>>(),
);

const encodeMemoMap = globalValue(
  Symbol.for("fncts.schema.Parser.encodeMemoMap"),
  () => new WeakMap<AST, Parser<any>>(),
);

function goMemo(ast: AST, isDecoding: boolean): Parser<any> {
  const memoMap = isDecoding ? decodeMemoMap : encodeMemoMap;
  const memo    = memoMap.get(ast);
  if (memo) {
    return memo;
  }
  const parser = go(ast, isDecoding);
  memoMap.set(ast, parser);
  return parser;
}

function go(ast: AST, isDecoding: boolean): Parser<any> {
  concrete(ast);
  switch (ast._tag) {
    case ASTTag.Declaration:
      return Parser.make(ast.decode(...ast.typeParameters));
    case ASTTag.Literal:
      return Parser.fromRefinement(ast, (u): u is typeof ast.literal => u === ast.literal);
    case ASTTag.UniqueSymbol:
      return Parser.fromRefinement(ast, (u): u is typeof ast.symbol => u === ast.symbol);
    case ASTTag.UndefinedKeyword:
    case ASTTag.VoidKeyword:
      return Parser.fromRefinement(ast, isUndefined);
    case ASTTag.NeverKeyword:
      return Parser.fromRefinement<any>(ast, (_): _ is never => false);
    case ASTTag.UnknownKeyword:
    case ASTTag.AnyKeyword:
      return Parser.make(ParseResult.succeed);
    case ASTTag.StringKeyword:
      return Parser.fromRefinement(ast, isString);
    case ASTTag.NumberKeyword:
      return Parser.fromRefinement(ast, isNumber);
    case ASTTag.BooleanKeyword:
      return Parser.fromRefinement(ast, isBoolean);
    case ASTTag.BigIntKeyword:
      return Parser.fromRefinement(ast, isBigInt);
    case ASTTag.SymbolKeyword:
      return Parser.fromRefinement(ast, isSymbol);
    case ASTTag.ObjectKeyword:
      return Parser.fromRefinement(ast, isObject);
    case ASTTag.Enum:
      return Parser.fromRefinement(ast, (u): u is any => ast.enums.some(([_, value]) => value === u));
    case ASTTag.TemplateLiteral: {
      const regex = getTemplateLiteralRegex(ast);
      return Parser.fromRefinement(ast, (u): u is any => isString(u) && regex.test(u));
    }
    case ASTTag.Tuple: {
      const elements = ast.elements.map((e) => goMemo(e.type, isDecoding));
      const rest     = ast.rest.map((rest) => rest.map((ast) => goMemo(ast, isDecoding)));
      return Parser.make((input, options) => {
        if (!Array.isArray(input)) {
          return ParseResult.fail(ParseError.TypeError(AST.unknownArray, input));
        }
        const output: Array<any>                = [];
        const errors: MutableVector<ParseError> = Vector.emptyPushable();
        const allErrors = options?.allErrors;
        let i           = 0;
        for (; i < elements.length; i++) {
          if (input.length < i + 1) {
            if (!ast.elements[i]!.isOptional) {
              const e = ParseError.IndexError(i, Vector(ParseError.MissingError));
              errors.push(e);
              if (allErrors) {
                continue;
              } else {
                return ParseResult.failures(errors);
              }
            }
          } else {
            const parser = elements[i]!;
            const t      = parser(input[i], options);
            Either.concrete(t);
            if (t.isLeft()) {
              const e = ParseError.IndexError(i, t.left.errors);
              errors.push(e);
              if (allErrors) {
                continue;
              } else {
                return ParseResult.failures(errors);
              }
            }
            output.push(t.right);
          }
        }

        if (rest.isJust()) {
          const head = rest.value.unsafeHead!;
          const tail = rest.value.tail;
          for (; i < input.length - tail.length; i++) {
            const t = head(input[i], options);
            Either.concrete(t);
            if (t.isLeft()) {
              const e = ParseError.IndexError(i, t.left.errors);
              errors.push(e);
              if (allErrors) {
                continue;
              } else {
                return ParseResult.failures(errors);
              }
            }
            output.push(t.right);
          }
          for (let j = 0; j < tail.length; j++) {
            i += j;
            if (input.length < i + 1) {
              errors.push(ParseError.IndexError(i, Vector(ParseError.MissingError)));
              return ParseResult.failures(errors);
            } else {
              const t = tail[j]!(input[i], options);
              Either.concrete(t);
              if (t.isLeft()) {
                const e = ParseError.IndexError(i, t.left.errors);
                errors.push(e);
                if (allErrors) {
                  continue;
                } else {
                  return ParseResult.failures(errors);
                }
              }
              output.push(t.right);
            }
          }
        } else {
          const isUnexpectedAllowed = options?.isUnexpectedAllowed;
          for (; i < input.length; i++) {
            const e = ParseError.IndexError(i, Vector(ParseError.UnexpectedError(input[i])));
            if (!isUnexpectedAllowed) {
              errors.push(e);
              if (allErrors) {
                continue;
              } else {
                return ParseResult.failures(errors);
              }
            }
          }
        }
        return errors.isNonEmpty() ? ParseResult.failures(errors) : ParseResult.succeed(output);
      });
    }
    case ASTTag.TypeLiteral: {
      if (ast.propertySignatures.length === 0 && ast.indexSignatures.length === 0) {
        return Parser.fromRefinement(ast, (u): u is Exclude<typeof u, null> => u !== null);
      }
      const propertySignatureTypes = ast.propertySignatures.map((f) => goMemo(f.type, isDecoding));
      const indexSignatures        = ast.indexSignatures.map(
        (is) => [goMemo(is.parameter, isDecoding), goMemo(is.type, isDecoding)] as const,
      );
      return Parser.make((input, options) => {
        if (!isRecord(input)) {
          return ParseResult.fail(ParseError.TypeError(AST.unknownRecord, input));
        }
        const output: any                       = {};
        const expectedKeys: any                 = {};
        const errors: MutableVector<ParseError> = Vector.emptyPushable();
        const allErrors = options?.allErrors;

        for (let i = 0; i < propertySignatureTypes.length; i++) {
          const ps           = ast.propertySignatures[i]!;
          const parser       = propertySignatureTypes[i]!;
          const name         = ps.name;
          expectedKeys[name] = null;
          if (!Object.prototype.hasOwnProperty.call(input, name)) {
            if (!ps.isOptional) {
              const e = ParseError.KeyError(AST.createKey(name), name, Vector(ParseError.MissingError));
              errors.push(e);
              if (allErrors) {
                continue;
              } else {
                return ParseResult.failures(errors);
              }
            }
          } else {
            const t: ParseResult<unknown> = parser(input[name], options);
            Either.concrete(t);
            if (t.isLeft()) {
              const e = ParseError.KeyError(AST.createKey(name), name, t.left.errors);
              errors.push(e);
              if (allErrors) {
                continue;
              } else {
                return ParseResult.failures(errors);
              }
            }
            output[name] = t.right;
          }
        }

        if (indexSignatures.length > 0) {
          for (let i = 0; i < indexSignatures.length; i++) {
            const [parameter, type] = indexSignatures[i]!;
            const keys              = getKeysForIndexSignature(input, ast.indexSignatures[i]!.parameter);
            for (const key of keys) {
              if (Object.prototype.hasOwnProperty.call(expectedKeys, key)) {
                continue;
              }

              let t = parameter(key, options);
              Either.concrete(t);
              if (t.isLeft()) {
                const e = ParseError.KeyError(AST.createKey(key), key, t.left.errors);
                errors.push(e);
                if (allErrors) {
                  continue;
                } else {
                  return ParseResult.failures(errors);
                }
              }

              t = type(input[key], options);
              Either.concrete(t);
              if (t.isLeft()) {
                const e = ParseError.KeyError(AST.createKey(key), key, t.left.errors);
                errors.push(e);
                if (allErrors) {
                  continue;
                } else {
                  return ParseResult.failures(errors);
                }
              }

              output[key] = t.right;
            }
          }
        } else {
          const isUnexpectedAllowed = options?.isUnexpectedAllowed;
          for (const key of ownKeys(input)) {
            if (!Object.prototype.hasOwnProperty.call(expectedKeys, key)) {
              const e = ParseError.KeyError(AST.createKey(key), key, Vector(ParseError.UnexpectedError(input[key])));
              if (!isUnexpectedAllowed) {
                errors.push(e);
                if (allErrors) {
                  continue;
                } else {
                  return ParseResult.failures(errors);
                }
              }
            }
          }
        }

        return errors.isNonEmpty() ? ParseResult.failures(errors) : ParseResult.succeed(output);
      });
    }
    case ASTTag.Union: {
      const searchTree = getSearchTree(ast.types, isDecoding);
      const ownKeys    = Reflect.ownKeys(searchTree.keys);
      const len        = ownKeys.length;
      const otherwise  = searchTree.otherwise;
      const map        = new Map<any, Parser<any>>();
      ast.types.forEach((ast) => {
        map.set(ast, goMemo(ast, isDecoding));
      });
      return Parser.make((input, options) => {
        const errors = Vector.emptyPushable<ParseError>();
        if (len > 0) {
          if (isRecord(input)) {
            for (let i = 0; i < len; i++) {
              const name    = ownKeys[i]!;
              const buckets = searchTree.keys[name]!.buckets;
              if (Object.prototype.hasOwnProperty.call(input, name)) {
                const literal = String(input[name]);
                if (Object.prototype.hasOwnProperty.call(buckets, literal)) {
                  const bucket: ReadonlyArray<AST> = buckets[literal]!;
                  for (let i = 0; i < bucket.length; i++) {
                    const t = map.get(bucket[i])!(input, options);
                    Either.concrete(t);
                    if (t.isRight()) {
                      return t;
                    } else {
                      errors.push(ParseError.UnionMemberError(t.left.errors));
                    }
                  }
                } else {
                  errors.push(
                    ParseError.KeyError(
                      AST.createKey(name),
                      name,
                      Vector(ParseError.TypeError(searchTree.keys[name]!.ast, input[name])),
                    ),
                  );
                }
              } else {
                errors.push(ParseError.KeyError(AST.createKey(name), name, Vector(ParseError.MissingError)));
              }
            }
          } else {
            errors.push(ParseError.TypeError(AST.unknownRecord, input));
          }
        }
        for (let i = 0; i < otherwise.length; i++) {
          const t = map.get(otherwise[i])!(input, options);
          Either.concrete(t);
          if (t.isRight()) {
            return t;
          } else {
            errors.push(ParseError.UnionMemberError(t.left.errors));
          }
        }

        return errors.isNonEmpty()
          ? ParseResult.failures(errors)
          : ParseResult.fail(ParseError.TypeError(AST.neverKeyword, input));
      });
    }
    case ASTTag.Lazy: {
      const f   = () => goMemo(ast.getAST(), isDecoding);
      const get = memoize<void, Parser<any>>(f);
      return Parser.make((a, options) => get()(a, options));
    }
    case ASTTag.Refinement: {
      if (isDecoding) {
        const from = goMemo(ast.from, isDecoding);
        return Parser.make((input, options) =>
          from(input, options)
            .mapLeft((failure) => ParseFailure(Vector(RefinementError(ast, input, "From", failure.errors))))
            .flatMap((a) =>
              ast
                .decode(a, options)
                .mapLeft((failure) => ParseFailure(Vector(RefinementError(ast, input, "Predicate", failure.errors)))),
            ),
        );
      } else {
        const from = goMemo(ast.from, true);
        const to   = goMemo(ast.from.getTo, false);
        return Parser.make((input, options) =>
          to(input, options)
            .flatMap((a) => ast.decode(a, options))
            .flatMap((a) => from(a, options)),
        );
      }
    }
    case ASTTag.Transform: {
      const transformation = isDecoding ? ast.decode : ast.encode;
      const from           = isDecoding ? goMemo(ast.from, true) : goMemo(ast.to, false);
      const to             = isDecoding ? goMemo(ast.to, true) : goMemo(ast.from, false);
      return Parser.make((input, options) =>
        from(input, options)
          .mapLeft((failure) =>
            ParseFailure(Vector(TransformationError(ast, input, isDecoding ? "Encoded" : "Type", failure.errors))),
          )
          .flatMap((a) =>
            transformation(a, options).mapLeft((failure) =>
              ParseFailure(Vector(TransformationError(ast, input, "Transformation", failure.errors))),
            ),
          )
          .flatMap((a) =>
            to(a, options).mapLeft((failure) =>
              ParseFailure(Vector(TransformationError(ast, input, isDecoding ? "Type" : "Encoded", failure.errors))),
            ),
          ),
      );
    }
    case ASTTag.Validation: {
      return Parser.make((u, options) => {
        const missedBrands = Vector.emptyPushable<Validation<any, string>>();
        const allErrors    = options?.allErrors;
        for (const validation of ast.validation) {
          if (!validation.validate(u)) {
            missedBrands.push(validation);
            if (allErrors) {
              continue;
            } else {
              return ParseResult.fail(
                ParseError.TypeError(AST.createValidation(ast.from, missedBrands, ast.annotations), u),
              );
            }
          }
        }
        return missedBrands.length > 0
          ? ParseResult.fail(ParseError.TypeError(AST.createValidation(ast.from, missedBrands, ast.annotations), u))
          : ParseResult.succeed(u);
      });
    }
  }
}

export function parserFor(ast: AST, isDecoding: boolean): Parser<any> {
  return goMemo(ast, isDecoding);
}
