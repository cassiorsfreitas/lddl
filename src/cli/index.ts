#!/usr/bin/env node

import { Command } from "commander";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { newCommand } from "./new.js";
import { initCommand } from "./init.js";
import { listCommand } from "./list.js";
import { handlePreCommit, handlePrepareCommitMsg } from "./hook-handlers.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../../package.json"), "utf-8")
);

const program = new Command();

program
  .name("lddl")
  .description("Local-first CLI to log technical decisions.")
  .version(packageJson.version);

program
  .command("init")
  .description("Initialize LDDL in your repository (installs git hooks)")
  .action(initCommand);

program
  .command("new")
  .description("Create a new decision log")
  .option("-t, --title <title>", "Decision title")
  .option("-c, --context <context>", "Context for the decision")
  .option("-d, --decision <decision>", "The decision made")
  .option("-C, --consequences <consequences>", "Consequences of the decision")
  .option("-r, --references <references>", "References or links")
  .action(newCommand);

program
  .command("list")
  .description("List all decision logs")
  .action(listCommand);

program
  .command("__hook-pre-commit")
  .description("Internal: called by pre-commit hook")
  .action(handlePreCommit);

program
  .command("__hook-prepare-commit-msg <commitMsgFile>")
  .description("Internal: called by prepare-commit-msg hook")
  .action(handlePrepareCommitMsg);

program.parseAsync();
