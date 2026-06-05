import { ESLintUtils } from "@typescript-eslint/utils";

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/allen2dev/agent-ready-react/docs/rules/${name}`
);

export default createRule({
  name: "require-surface-for-interactive",
  meta: {
    type: "suggestion",
    docs: {
      description: "Warn when JSX has onClick without useAgentSurface in file"
    },
    schema: [],
    messages: {
      missingSurface:
        "Files with onClick handlers should register an agent surface via useAgentSurface."
    }
  },
  defaultOptions: [],
  create(context) {
    const source = context.sourceCode;
    const text = source.getText();
    const hasOnClick = /\bonClick\b/.test(text);
    const hasSurface = /useAgentSurface\s*\(/.test(text);
    if (hasOnClick && !hasSurface) {
      return {
        Program(node) {
          context.report({ node, messageId: "missingSurface" });
        }
      };
    }
    return {};
  }
});
