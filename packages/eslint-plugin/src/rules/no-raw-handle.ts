import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/allen2dev/agent-ready-react/docs/rules/${name}`
);

export default createRule({
  name: "no-raw-handle",
  meta: {
    type: "suggestion",
    docs: {
      description: "Discourage hardcoded agent handle strings"
    },
    schema: [],
    messages: {
      rawHandle: "Avoid hardcoded agent handle strings; use a shared constant."
    }
  },
  defaultOptions: [],
  create(context) {
    return {
      Literal(node) {
        if (
          typeof node.value === "string" &&
          /^[a-z][a-z0-9-]*:\/\//.test(node.value)
        ) {
          context.report({ node, messageId: "rawHandle" });
        }
      }
    };
  }
});
