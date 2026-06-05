#!/usr/bin/env node
import { Command } from "commander";
import { validateCommand } from "./validate.js";
import { codegenMcp } from "./codegen-mcp.js";
import { codegenDocs } from "./codegen-docs.js";

const program = new Command();

program
  .name("agent-ready")
  .description("Agent Ready React SDK CLI")
  .version("0.0.0");

program
  .command("validate")
  .argument("<manifest>", "Path to manifest JSON file")
  .description("Validate agent manifest JSON against schema")
  .action(validateCommand);

const codegen = program.command("codegen").description("Codegen utilities");

codegen
  .command("mcp")
  .argument("<output>", "Output JSON path")
  .action(codegenMcp);

codegen
  .command("docs")
  .argument("<output>", "Output markdown path")
  .action(codegenDocs);

program.parse();
