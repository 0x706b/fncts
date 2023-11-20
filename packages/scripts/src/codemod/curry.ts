import ts from "typescript";

export const curry =
  (program: ts.Program): ts.TransformerFactory<ts.SourceFile> =>
  (context) =>
  (sourceFile) => {
    let inOverloads = false;
    const typeChecker = program.getTypeChecker();
    const newStatements = ts.visitNodes(sourceFile.statements, function visitor(node) {
      if (ts.isFunctionDeclaration(node) && node.type && node.parameters.length > 1) {
        if (
          node.parameters.length === 2 &&
          node.parameters[node.parameters.length - 1] !== undefined &&
          node.parameters[node.parameters.length - 1]!.name.getFullText(sourceFile) === "__tsplusTrace"
        ) {
          return node;
        }
        const jsDocTags = ts.getJSDocTags(node);
        if (jsDocTags.find((tag) => tag.getFullText(sourceFile).includes("tsplus fluent")) || inOverloads) {
          const curriedParameter = node.parameters[0]!;
          const otherParameters = node.parameters.slice(1);
          const [typeParameters, curriedTypeParameters] = Array.from(node.typeParameters ?? []).reduce(
            ([typeParameters, curriedTypeParameters], cur) => {
              for (const param of otherParameters) {
                if (param.type && hasTypeNode(typeChecker, param.type, cur)) {
                  if (typeParameters.includes(cur)) {
                    continue;
                  } else {
                    if (curriedTypeParameters.includes(cur)) {
                      curriedTypeParameters = curriedTypeParameters.filter((decl) => decl !== cur);
                    }
                    typeParameters.push(cur);
                  }
                } else {
                  if (typeParameters.includes(cur) || curriedTypeParameters.includes(cur)) {
                    continue;
                  } else {
                    curriedTypeParameters.push(cur);
                  }
                }
              }
              return [typeParameters, curriedTypeParameters];
            },
            [[], []] as [ts.TypeParameterDeclaration[], ts.TypeParameterDeclaration[]],
          );
          if (!node.body) {
            inOverloads = true;
          } else {
            inOverloads = false;
          }
          return context.factory.updateFunctionDeclaration(
            node,
            node.modifiers,
            node.asteriskToken,
            node.name,
            typeParameters,
            otherParameters,
            !node.body
              ? context.factory.createFunctionTypeNode(curriedTypeParameters, [curriedParameter], node.type)
              : undefined,
            node.body
              ? context.factory.createBlock(
                  [
                    context.factory.createReturnStatement(
                      context.factory.createArrowFunction(
                        undefined,
                        curriedTypeParameters,
                        [curriedParameter],
                        node.type,
                        context.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                        node.body,
                      ),
                    ),
                  ],
                  true,
                )
              : undefined,
          );
        }
      }
      return node;
    }) as ts.NodeArray<ts.Statement>;
    return context.factory.updateSourceFile(
      sourceFile,
      newStatements,
      sourceFile.isDeclarationFile,
      sourceFile.referencedFiles,
      sourceFile.typeReferenceDirectives,
      sourceFile.hasNoDefaultLib,
      sourceFile.libReferenceDirectives,
    );
  };

function hasTypeNode(checker: ts.TypeChecker, node: ts.TypeNode, search: ts.Node) {
  const searchType = checker.getTypeAtLocation(search);
  let found = false;
  ts.forEachChild(node, function visitor(node) {
    const type = checker.getTypeAtLocation(node);
    if (type === searchType) {
      found = true;
      return;
    }
    ts.forEachChild(node, visitor);
  });
  return found;
}
