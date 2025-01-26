import * as ts from "typescript";
import { v4 } from "uuid";

export default function transformId(program: ts.Program, _config: {}): ts.TransformerFactory<ts.SourceFile> {
  const checker = program.getTypeChecker();
  return (context) => (sourceFile) =>
    ts.visitEachChild(
      sourceFile,
      function visitor(node): ts.Node {
        if (ts.isCallExpression(node)) {
          let declaration: ts.FunctionDeclaration | undefined;
          if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
            const expressionOriginalNode = ts.getOriginalNode(node.expression);
            const nodeLinks              = checker.getNodeLinks(expressionOriginalNode);
            if (nodeLinks.tsPlusStaticExtension) {
              const staticExtension = nodeLinks.tsPlusStaticExtension;
              // @ts-expect-error
              if (staticExtension.type.symbol.tsPlusDeclaration) {
                // @ts-expect-error
                declaration = staticExtension.type.symbol.tsPlusDeclaration as ts.FunctionDeclaration;
              }
            }
          }

          if (ts.isCallExpression(node)) {
            const originalNode      = ts.getOriginalNode(node);
            const originalNodeLinks = checker.getNodeLinks(originalNode);
            if (originalNodeLinks.tsPlusCallExtension) {
              const callExtension = originalNodeLinks.tsPlusCallExtension;
              // @ts-expect-error
              if (callExtension.patched.target?.tsPlusDeclaration) {
                // @ts-expect-error
                declaration = callExtension.patched.target.tsPlusDeclaration as ts.FunctionDeclaration;
              }
            }
          }

          if (declaration) {
            const updatedArguments = node.arguments.slice();
            for (let i = 0; i < declaration.parameters.length; i++) {
              if (node.arguments[i] !== undefined) {
                continue;
              }
              const param = declaration.parameters[i]!;
              const tags  = ts.getJSDocTags(param);
              if (
                tags &&
                tags.find(
                  (tag) =>
                    tag.tagName.escapedText === "fncts" && typeof tag.comment === "string" && tag.comment === "id",
                )
              ) {
                updatedArguments[i] = context.factory.createStringLiteral(v4());
              }
            }
            const update = context.factory.updateCallExpression(
              node,
              node.expression,
              node.typeArguments,
              updatedArguments,
            );
            // @ts-expect-error
            update.parent = node.parent;
            return update;
          }

          return ts.visitEachChild(node, visitor, context);
        }

        return ts.visitEachChild(node, visitor, context);
      },
      context,
    );
}
