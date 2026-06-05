import { RuleTester } from "@typescript-eslint/rule-tester";
import rule from "./no-raw-handle.js";

const ruleTester = new RuleTester();

ruleTester.run("no-raw-handle", rule, {
  valid: [{ code: `const x = "hello";` }],
  invalid: [
    {
      code: `const h = "app://demo/page/main";`,
      errors: [{ messageId: "rawHandle" }]
    }
  ]
});
