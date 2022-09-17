import * as ts from "typescript";
import { v4 } from "uuid";

export default function transformTag(program: ts.Program, _config: {}): ts.TransformerFactory<ts.SourceFile> {
  const checker = program.getTypeChecker();
  return (context) => (sourceFile) => ts.visitEachChild(sourceFile, function visitor (node): ts.Node {
    if (ts.isCallExpression(node) && node.arguments.length === 0) {
      const originalNode = ts.getOriginalNode(node);
      const nodeLinks    = checker.getNodeLinks(originalNode);
      if (nodeLinks.tsPlusCallExtension) {
        const callExtension = nodeLinks.tsPlusCallExtension;
        // @ts-expect-error
        if (callExtension.patched.target?.tsPlusDeclaration) {
          // @ts-expect-error
          const declaration = callExtension.patched.target.tsPlusDeclaration as ts.Declaration;
          const tags        = ts.getJSDocTags(declaration);
          if (tags && tags.find((tag) => tag.tagName.escapedText === "fncts" && typeof tag.comment === "string" && tag.comment === "tag")) {
            const update = context.factory.updateCallExpression(node, node.expression, node.typeArguments, [context.factory.createStringLiteral(v4())]);
            // @ts-expect-error
            update.parent = node.parent;
            return update;
          }
        }
      }
    }
    return ts.visitEachChild(node, visitor, context);
  }, context);
}

