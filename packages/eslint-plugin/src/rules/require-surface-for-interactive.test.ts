import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "./require-surface-for-interactive.js";

const ruleTester = new RuleTester();

ruleTester.run("require-surface-for-interactive", rule, {
  valid: [
    `function Ok() { useAgentSurface({}); return { onClick: () => {} }; }`
  ],
  invalid: [
    {
      code: `function Bad() { return { onClick: () => {} }; }`,
      errors: [{ messageId: "missingSurface" }]
    }
  ]
});
