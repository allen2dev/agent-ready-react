import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "./schema-sync.js";

const ruleTester = new RuleTester();

ruleTester.run("schema-sync", rule, {
  valid: [
    `const a = defineAction({ name: "x", description: "desc", input: z.object({}) });`
  ],
  invalid: [
    {
      code: `const a = defineAction({ name: "x", input: z.object({}) });`,
      errors: [{ messageId: "missingDescription" }]
    }
  ]
});
