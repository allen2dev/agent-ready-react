#!/usr/bin/env node
import { Command } from "commander";
import { validateCommand } from "./validate.js";

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

program.parse();
