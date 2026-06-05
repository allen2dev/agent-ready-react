import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/allen2dev/agent-ready-react/docs/rules/${name}`
);

export default createRule({
  name: "schema-sync",
  meta: {
    type: "problem",
    docs: {
      description: "Require defineAction to include a description string"
    },
    schema: [],
    messages: {
      missingDescription: "Action definitions must include a non-empty description."
    }
  },
  defaultOptions: [],
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "defineAction" &&
          node.arguments[0]?.type === "ObjectExpression"
        ) {
          const obj = node.arguments[0];
          const desc = obj.properties.find(
            (p) =>
              p.type === "Property" &&
              p.key.type === "Identifier" &&
              p.key.name === "description"
          );
          if (!desc) {
            context.report({ node, messageId: "missingDescription" });
          }
        }
      }
    };
  }
});
