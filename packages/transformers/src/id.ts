import * as ts from "typescript";
import { v4 } from "uuid";

export default function transformId(program: ts.Program, _config: {}): ts.TransformerFactory<ts.SourceFile> {
  const checker = program.getTypeChecker();
  return (context) => (sourceFile) =>
    ts.visitEachChild(
      sourceFile,
      function visitor(node): ts.Node {
        if (ts.isCallExpression(node)) {
          const originalNode = ts.getOriginalNode(node);
          const nodeLinks    = checker.getNodeLinks(originalNode);
          if (nodeLinks.tsPlusCallExtension) {
            const callExtension = nodeLinks.tsPlusCallExtension;
            // @ts-expect-error
            if (callExtension.patched.target?.tsPlusDeclaration) {
              // @ts-expect-error
              const declaration      = callExtension.patched.target.tsPlusDeclaration as ts.FunctionDeclaration;
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
          }
        }
        return ts.visitEachChild(node, visitor, context);
      },
      context,
    );
}
