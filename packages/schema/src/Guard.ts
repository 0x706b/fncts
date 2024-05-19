import { globalValue } from "@fncts/base/data/Global";
import { isRecord } from "@fncts/base/util/predicates";
import { getKeysForIndexSignature, memoize } from "@fncts/schema/utils";

import { ASTTag, getSearchTree } from "./AST.js";
import { parserFor } from "./Parser.js";

/**
 * @tsplus getter fncts.schema.Schema is
 */
export function is<A>(schema: Schema<A>) {
  return (input: unknown): input is A => {
    return guardFor(schema).is(input);
  };
}

export function guardFor<A>(schema: Schema<A>): Guard<A> {
  return goMemo(schema.ast);
}

const guardStrict = (value: unknown) => Guard((inp): inp is any => inp === value);

const guardMemoMap = globalValue(Symbol.for("fncts.schema.Guard.guardMemoMap"), () => new WeakMap<AST, Guard<any>>());

function goMemo(ast: AST): Guard<any> {
  const memo = guardMemoMap.get(ast);
  if (memo) {
    return memo;
  }
  const guard = go(ast);
  guardMemoMap.set(ast, guard);
  return guard;
}

function go(ast: AST): Guard<any> {
  AST.concrete(ast);
  switch (ast._tag) {
    case ASTTag.Declaration: {
      const parser = parserFor(ast, true);
      return Guard((inp): inp is any =>
        parser(inp).match(
          () => false,
          () => true,
        ),
      );
    }
    case ASTTag.Literal: {
      return Guard((inp): inp is any => inp === ast.literal);
    }
    case ASTTag.UniqueSymbol: {
      return guardStrict(ast.symbol);
    }
    case ASTTag.VoidKeyword:
    case ASTTag.UndefinedKeyword: {
      return guardStrict(undefined);
    }
    case ASTTag.NeverKeyword: {
      return Guard((inp): inp is never => false);
    }
    case ASTTag.UnknownKeyword:
    case ASTTag.AnyKeyword: {
      return Guard((inp): inp is any => true);
    }
    case ASTTag.NumberKeyword: {
      return Guard.number;
    }
    case ASTTag.BooleanKeyword: {
      return Guard.boolean;
    }
    case ASTTag.StringKeyword: {
      return Guard.string;
    }
    case ASTTag.BigIntKeyword: {
      return Guard.bigint;
    }
    case ASTTag.SymbolKeyword: {
      return Guard((inp): inp is symbol => typeof inp === "symbol");
    }
    case ASTTag.ObjectKeyword: {
      return Guard(isObject);
    }
    case ASTTag.TemplateLiteral: {
      const parser = parserFor(ast, true);
      return Guard((inp): inp is any =>
        parser(inp).match(
          () => false,
          () => true,
        ),
      );
    }
    case ASTTag.Tuple: {
      const elements     = ast.elements.map((element) => goMemo(element.type));
      const restElements = ast.rest.match(
        () => Vector.empty<Guard<any>>(),
        (rest) => rest.map(goMemo),
      );

      return Guard((input): input is any => {
        if (!Array.isArray(input)) {
          return false;
        }

        let i = 0;
        for (; i < elements.length; i++) {
          if (input.length < i + 1) {
            if (!ast.elements[i]!.isOptional) {
              return false;
            }
          } else {
            const guard = elements[i]!;
            if (!guard.is(input[i])) {
              return false;
            }
          }
        }

        if (restElements.length > 0) {
          const head = restElements.unsafeHead!;
          const tail = restElements.tail;
          for (; i < input.length - tail.length; i++) {
            if (!head.is(input[i])) {
              return false;
            }
          }
          for (let j = 0; j < tail.length; j++) {
            i += j;
            if (input.length < i + 1) {
              return false;
            }
            const guard = tail[j]!;
            if (!guard.is(input[i])) {
              return false;
            }
          }
        }

        return true;
      });
    }
    case ASTTag.TypeLiteral: {
      if (ast.propertySignatures.length === 0 && ast.indexSignatures.length === 0) {
        return Guard((input): input is Exclude<typeof input, null> => input !== null);
      }
      const propertySignatureTypes = ast.propertySignatures.map((ps) => goMemo(ps.type));
      const indexSignatures        = ast.indexSignatures.map((is) => [goMemo(is.parameter), goMemo(is.type)] as const);
      return Guard((input): input is any => {
        if (!isRecord(input)) {
          return false;
        }

        const expectedKeys: any = {};

        console.log(ast.propertySignatures);
        for (let i = 0; i < propertySignatureTypes.length; i++) {
          const ps           = ast.propertySignatures[i]!;
          const guard        = propertySignatureTypes[i]!;
          const name         = ps.name;
          expectedKeys[name] = null;
          if (!Object.prototype.hasOwnProperty.call(input, name)) {
            if (!ps.isOptional) {
              return false;
            }
          } else {
            if (!guard(input[name])) {
              return false;
            }
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

              if (!parameter(key)) {
                return false;
              }

              if (!type(input[key])) {
                return false;
              }
            }
          }
        }

        return true;
      });
    }
    case ASTTag.Union: {
      const searchTree = getSearchTree(ast.types, true);
      const ownKeys    = Reflect.ownKeys(searchTree.keys);
      const len        = ownKeys.length;
      const otherwise  = searchTree.otherwise;
      const map        = new Map<any, Guard<any>>();
      ast.types.forEach((ast) => {
        map.set(ast, goMemo(ast));
      });
      return Guard((input): input is any => {
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
                    if (map.get(bucket[i])!(input)) {
                      return true;
                    }
                  }
                }
              }
            }
          }
        }
        for (let i = 0; i < otherwise.length; i++) {
          if (map.get(otherwise[i])!(input)) {
            return true;
          }
        }
        return false;
      });
    }
    case ASTTag.Lazy: {
      const f   = () => goMemo(ast.getAST());
      const get = memoize<void, Guard<any>>(f);
      return Guard((input): input is any => get()(input));
    }
    case ASTTag.Enum: {
      return Guard((input): input is any => ast.enums.some(([_, value]) => value === input));
    }
    case ASTTag.Refinement: {
      const from = goMemo(ast.from);
      return Guard((input): input is any => {
        if (!from(input)) {
          return false;
        }
        if (!ast.predicate(input)) {
          return false;
        }
        return true;
      });
    }
    case ASTTag.Transform: {
      return goMemo(ast.to);
    }
    case ASTTag.Validation: {
      const from = goMemo(ast.from);
      return Guard((input): input is any => {
        if (!from(input)) {
          return false;
        }
        for (const validation of ast.validation) {
          if (!validation.validate(input)) {
            return false;
          }
        }
        return true;
      });
    }
  }
}
