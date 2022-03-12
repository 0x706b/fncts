import generate from "@babel/generator";
import { parse } from "@babel/parser";
import type { Preset } from "eslint-plugin-codegen";
import * as fs from "fs";
import * as ts from "typescript";
import { format } from "prettier";

/**
 * A simple static analysis that tries to infer
 * which generic type declarations are actually used by the signature
 */
function interpretReferencedTypeNames(node: ts.TypeNode): string[] {
  const referencedArgs: string[] = [];
  const stack: ts.TypeNode[] = [node];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) return referencedArgs;

    if (ts.isTypeReferenceNode(current)) {
      // A
      if (current.typeArguments) stack.push(...current.typeArguments);
      if (ts.isIdentifier(current.typeName))
        referencedArgs.push(current.typeName.text);
    } else if (ts.isUnionTypeNode(current)) {
      // A | B
      stack.push(...current.types);
    } else if (ts.isIntersectionTypeNode(current)) {
      // A & B
      stack.push(...current.types);
    } else if (ts.isFunctionTypeNode(current)) {
      // (e: E) => A
      current.parameters.forEach((parameter) => {
        if (parameter.type) stack.push(parameter.type);
      });
      stack.push(current.type);
    } else if (ts.isIndexedAccessTypeNode(current)) {
      // A[K]
      stack.push(current.objectType, current.indexType);
    } else if (ts.isMappedTypeNode(current)) {
      // {[P in K]: A}
      if (current.typeParameter.constraint)
        stack.push(current.typeParameter.constraint);
      if (current.type) stack.push(current.type);
    } else if (ts.isTypeOperatorNode(current)) {
      // keyof A & company
      if (current.type) stack.push(current.type);
    } else if (ts.isTypeLiteralNode(current)) {
      // {_tag: A}
      if (current.members)
        current.members.forEach((member) => {
          if (ts.isPropertySignature(member) && member.type) {
            stack.push(member.type);
          }
        });
    } else if (ts.isTupleTypeNode(current)) {
      // [A, B]
      current.elements.forEach((element) => {
        stack.push(element);
      });
    } else if (
      // constant nodes
      current.kind === ts.SyntaxKind.StringKeyword ||
      current.kind === ts.SyntaxKind.NumberKeyword ||
      current.kind === ts.SyntaxKind.NullKeyword ||
      current.kind === ts.SyntaxKind.BooleanKeyword ||
      current.kind === ts.SyntaxKind.UnknownKeyword ||
      current.kind === ts.SyntaxKind.NeverKeyword ||
      current.kind === ts.SyntaxKind.AnyKeyword ||
      current.kind === ts.SyntaxKind.VoidKeyword
    ) {
      // pass
    } else {
      // TO BE HANDLED!
      throw new Error(
        "Unknown TypeNode " +
          current.getText() +
          " while interpreting " +
          node.getText()
      );
    }
  }
  return referencedArgs;
}

function normalise(str: string) {
  try {
    return generate(
      parse(str, { sourceType: "module", plugins: ["typescript"] }) as any
    )
      .code.replace(/'/g, `"`)
      .replace(/\/index/g, "");
  } catch (e) {
    return str;
  }
}

function getJSDoc(node: ts.Node): ts.JSDoc | undefined {
  return "jsDoc" in node ? (node as any).jsDoc[0] : undefined;
}

function updateJSDoc<T extends ts.Node>(node: T, jsDoc: ts.JSDoc) {
  const comment = ts
    .createPrinter()
    .printNode(ts.EmitHint.Unspecified, jsDoc, node.getSourceFile())
    .trim()
    .replace(/^\/\*|\*\/$/g, "");
  return ts.addSyntheticLeadingComment(
    node,
    ts.SyntaxKind.MultiLineCommentTrivia,
    comment,
    true
  );
}

interface DataFirstDeclaration {
  functionName: string;
  typeParameters: ts.NodeArray<ts.TypeParameterDeclaration>;
  parameters: ts.NodeArray<ts.ParameterDeclaration>;
  type: ts.TypeNode | undefined;
  implemented: boolean;
  jsDoc: ts.JSDoc | undefined;
}

interface ConstrainedDataFirstDeclaration {
  functionName: string;
  constrainedTypeParameters: ts.NodeArray<ts.TypeParameterDeclaration>;
  typeParameters: ts.NodeArray<ts.TypeParameterDeclaration>;
  constraintParameters: ts.NodeArray<ts.ParameterDeclaration>;
  parameters: ts.NodeArray<ts.ParameterDeclaration>;
  type: ts.TypeNode | undefined;
  implemented: boolean;
  jsDoc: ts.JSDoc | undefined;
}

function createPipeableFunctionDeclaration(
  decl: DataFirstDeclaration
): ts.FunctionDeclaration {
  // create the pipeable function name
  const pipeableName = decl.functionName.substring(
    0,
    decl.functionName.length - 1
  );
  const pipeableIdentifier = ts.factory.createIdentifier(pipeableName);

  const typeParameterConstraints = filterMap(
    decl.typeParameters,
    (typeParam) => typeParam.constraint
  );

  const restUsedTypeArgs = decl.parameters
    .slice(1)
    .map((param) => param.type!)
    .concat(typeParameterConstraints)
    .map(interpretReferencedTypeNames)
    .flat();

  const faTypeArgs = decl.typeParameters.filter(
    (parameter) => restUsedTypeArgs.indexOf(parameter.name.text) === -1
  );
  const returnTypeArgs = decl.typeParameters.filter(
    (parameter) => restUsedTypeArgs.indexOf(parameter.name.text) !== -1
  );

  // based on if function is implemented or not,
  // we switch between two different approaches:
  // export function map(b: B): <A>(a: A) => C
  // export function map(b: B) { return <A>(a: A): C => }
  const returnType = decl.type
    ? ts.factory.createFunctionTypeNode(
        faTypeArgs,
        decl.parameters.slice(0, 1),
        decl.type
      )
    : undefined;

  const datafirstFunctionCall = ts.factory.createCallExpression(
    ts.factory.createIdentifier(decl.functionName),
    [],
    decl.parameters.map((p, i) =>
      ts.isIdentifier(p.name)
        ? p.name
        : ts.factory.createIdentifier("unknown_parameter_" + i)
    )
  );

  const pipeableArrow = ts.factory.createArrowFunction(
    [],
    faTypeArgs,
    decl.parameters.slice(0, 1),
    decl.type,
    undefined,
    datafirstFunctionCall
  );

  const returnPipeableArrow = ts.factory.createBlock(
    [ts.factory.createReturnStatement(pipeableArrow)],
    true
  );

  const pipeableFunctionDeclaration = ts.factory.createFunctionDeclaration(
    [],
    ts.factory.createModifiersFromModifierFlags(ts.ModifierFlags.Export),
    undefined,
    pipeableIdentifier,
    returnTypeArgs,
    decl.parameters.slice(1),
    decl.implemented ? undefined : returnType,
    decl.implemented ? returnPipeableArrow : undefined
  );

  const tsplusDataFirstCommentTag = ts.factory.createJSDocUnknownTag(
    ts.factory.createIdentifier("tsplus dataFirst"),
    decl.functionName
  );

  const baseComment = decl.jsDoc ? decl.jsDoc : ts.factory.createJSDocComment();
  const baseTags =
    baseComment.tags?.filter((tag) => tag.tagName.text !== "tsplus") ||
    ts.factory.createNodeArray<ts.JSDocTag>();

  const comment = ts.factory.createJSDocComment(
    baseComment.comment,
    baseTags.concat([tsplusDataFirstCommentTag])
  );

  return updateJSDoc(pipeableFunctionDeclaration, comment);
}

function createPipeableConstrainedFunctionDeclaration(
  decl: ConstrainedDataFirstDeclaration
): ts.FunctionDeclaration {
  // create the pipeable function name
  const pipeableName = decl.functionName.substring(
    0,
    decl.functionName.length - 1
  );
  const pipeableIdentifier = ts.factory.createIdentifier(pipeableName);

  const typeParameterConstraints = filterMap(
    decl.typeParameters,
    (typeParam) => typeParam.constraint
  );

  // lookup for used type arguments used by all parameters except the first one
  const restUsedTypeArgs = decl.parameters
    .slice(1)
    .map((param) => param.type!)
    .concat(typeParameterConstraints)
    .map(interpretReferencedTypeNames)
    .flat();

  const faTypeArgs = decl.typeParameters.filter(
    (parameter) => restUsedTypeArgs.indexOf(parameter.name.text) === -1
  );
  const returnTypeArgs = decl.typeParameters.filter(
    (parameter) => restUsedTypeArgs.indexOf(parameter.name.text) !== -1
  );

  // based on if function is implemented or not,
  // we switch between two different approaches:
  // export function map(b: B): <A>(a: A) => C
  // export function map(b: B) { return <A>(a: A): C => }
  const returnType = decl.type
    ? ts.factory.createFunctionTypeNode(
        faTypeArgs,
        decl.parameters.slice(0, 1),
        decl.type
      )
    : undefined;

  const datafirstFunctionCall = ts.factory.createCallExpression(
    ts.factory.createCallExpression(
      ts.factory.createIdentifier(decl.functionName),
      [],
      decl.constraintParameters.map((p, i) =>
        ts.isIdentifier(p.name)
          ? p.name
          : ts.factory.createIdentifier("unknown_constraint_" + i)
      )
    ),
    [],
    decl.parameters.map((p, i) =>
      ts.isIdentifier(p.name)
        ? p.name
        : ts.factory.createIdentifier("unknown_parameter_" + i)
    )
  );

  const pipeableArrow = ts.factory.createArrowFunction(
    [],
    returnTypeArgs,
    decl.parameters.slice(1),
    undefined,
    undefined,
    ts.factory.createArrowFunction(
      [],
      faTypeArgs,
      decl.parameters.slice(0, 1),
      decl.type,
      undefined,
      datafirstFunctionCall
    )
  );

  const returnPipeableArrow = ts.factory.createBlock(
    [ts.factory.createReturnStatement(pipeableArrow)],
    true
  );

  const pipeableFunctionDeclaration = ts.factory.createFunctionDeclaration(
    [],
    ts.factory.createModifiersFromModifierFlags(ts.ModifierFlags.Export),
    undefined,
    pipeableIdentifier,
    decl.constrainedTypeParameters,
    decl.constraintParameters,
    decl.implemented ? undefined : returnType,
    decl.implemented ? returnPipeableArrow : undefined
  );

  const tsplusDataFirstCommentTag = ts.factory.createJSDocUnknownTag(
    ts.factory.createIdentifier("tsplus dataFirst"),
    decl.functionName
  );

  const baseComment = decl.jsDoc ? decl.jsDoc : ts.factory.createJSDocComment();
  const baseTags =
    baseComment.tags?.filter((tag) => tag.tagName.text !== "tsplus") ||
    ts.factory.createNodeArray<ts.JSDocTag>();

  const comment = ts.factory.createJSDocComment(
    baseComment.comment,
    baseTags.concat([tsplusDataFirstCommentTag])
  );

  return updateJSDoc(pipeableFunctionDeclaration, comment);
}

function printNode(node: ts.Node, sourceFile: ts.SourceFile): string {
  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
  });
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
}

export const pipeable: Preset<{
  exclude?: string;
}> = ({ meta, options }) => {
  try {
    // option to exclude some methods
    const exclude = (options.exclude || "").split(",");

    // checks and reads the file
    const sourcePath = meta.filename;
    if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) {
      throw Error(`Source path is not a file: ${sourcePath}`);
    }
    const sourceText = fs.readFileSync(sourcePath).toString();

    // create and parse the AST
    const sourceFile = ts.createSourceFile(
      sourcePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );

    // collect data-first declarations
    const dataFirstDeclarations: DataFirstDeclaration[] = filterMap(
      sourceFile.statements,
      getDataFirstDeclaration(sourceFile, exclude)
    );

    const constrainedDataFirstDeclarations: ConstrainedDataFirstDeclaration[] =
      filterMap(
        sourceFile.statements,
        getConstrinedDataFirstDeclaration(sourceFile, exclude)
      );

    // create the actual AST nodes
    const nodes = dataFirstDeclarations
      .map(createPipeableFunctionDeclaration)
      .concat(
        constrainedDataFirstDeclarations.map(
          createPipeableConstrainedFunctionDeclaration
        )
      );
    const expectedContent = format(
      nodes.map((node) => printNode(node, sourceFile)).join("\n"),
      { filepath: sourcePath }
    );

    // do not re-emit in a different style, or a loop will occur
    if (normalise(meta.existingContent) === normalise(expectedContent))
      return meta.existingContent;
    return expectedContent;
  } catch (e) {
    return (
      "/** Got exception: " +
      ("stack" in (e as any) ? (e as any).stack : "") +
      JSON.stringify(e) +
      "*/"
    );
  }
};

function isDataFirstCandidate(
  sourceFile: ts.SourceFile,
  exclude: string[],
  node: ts.Node
): node is ts.FunctionDeclaration {
  if (
    ts.isFunctionDeclaration(node) &&
    !!node.modifiers &&
    node.modifiers.findIndex(
      (mod) => mod.kind === ts.SyntaxKind.ExportKeyword
    ) !== -1 &&
    !!node.name &&
    node.parameters.length >= 2 &&
    node.name.getText(sourceFile).endsWith("_") &&
    exclude.indexOf(node.name.getText(sourceFile)) === -1
  ) {
    return true;
  }
  return false;
}

function getDataFirstDeclaration(sourceFile: ts.SourceFile, exclude: string[]) {
  return (node: ts.Node): DataFirstDeclaration | undefined => {
    if (isDataFirstCandidate(sourceFile, exclude, node)) {
      return {
        functionName: node.name!.getText(sourceFile),
        typeParameters: node.typeParameters || ts.factory.createNodeArray(),
        parameters: node.parameters || ts.factory.createNodeArray(),
        type: node.type!,
        implemented: !!node.body,
        jsDoc: getJSDoc(node),
      };
    }
  };
}

function isConstrainedCandidate(
  sourceFile: ts.SourceFile,
  exclude: string[],
  node: ts.Node
): node is ts.FunctionDeclaration {
  const jsDoc = getJSDoc(node);
  if (
    jsDoc &&
    jsDoc.tags &&
    jsDoc.tags.findIndex((tag) => tag.tagName.text === "constrained") !== -1 &&
    ts.isFunctionDeclaration(node) &&
    !!node.modifiers &&
    node.modifiers.findIndex(
      (mod) => mod.kind === ts.SyntaxKind.ExportKeyword
    ) !== -1 &&
    !!node.name &&
    node.name.getText(sourceFile).endsWith("_") &&
    exclude.indexOf(node.name.getText(sourceFile)) === -1
  ) {
    return true;
  }
  return false;
}

function getConstrinedDataFirstDeclaration(
  sourceFile: ts.SourceFile,
  exclude: string[]
) {
  return (node: ts.Node): ConstrainedDataFirstDeclaration | undefined => {
    if (isConstrainedCandidate(sourceFile, exclude, node)) {
      const body = node.body;
      if (body) {
        const statement = body.statements.find(ts.isReturnStatement);
        if (
          statement &&
          statement.expression &&
          ts.isArrowFunction(statement.expression) &&
          statement.expression.parameters.length >= 2
        ) {
          return {
            functionName: node.name!.getText(sourceFile),
            constrainedTypeParameters:
              node.typeParameters || ts.factory.createNodeArray(),
            constraintParameters:
              node.parameters || ts.factory.createNodeArray(),
            typeParameters:
              statement.expression.typeParameters ||
              ts.factory.createNodeArray(),
            parameters:
              statement.expression.parameters || ts.factory.createNodeArray(),
            type: node.type!,
            implemented: !!node.body,
            jsDoc: getJSDoc(node),
          };
        }
      }
    }
  };
}

function filterMap<A, B>(
  as: A[] | readonly A[],
  f: (a: A) => B | undefined
): B[] {
  if (as.length === 0) {
    return [];
  }
  const bs: B[] = [];
  for (let i = 0; i < as.length; i++) {
    const b = f(as[i]!);
    if (b !== undefined) {
      bs.push(b);
    }
  }
  return bs;
}
