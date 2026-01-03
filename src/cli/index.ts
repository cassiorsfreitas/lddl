#!/usr/bin/env node

import { Command } from "commander";
import { newCommand } from "./new.js";
import { initCommand } from "./init.js";
import { listCommand } from "./list.js";
import { handlePreCommit } from "./hook-handlers.js";

const program = new Command();

program
  .name("lddl")
  .description("Local-first CLI to log technical decisions.")
  .version("0.0.1");

program
  .command("init")
  .description("Initialize LDDL in your repository (installs git hooks)")
  .action(initCommand);

program
  .command("new")
  .description("Create a new decision log")
  .option("-t, --title <title>", "Decision title")
  .action(newCommand);

program
  .command("list")
  .description("List all decision logs")
  .action(listCommand);

program
  .command("__hook-pre-commit")
  .description("Internal: called by pre-commit hook")
  .action(handlePreCommit);

program.parseAsync();
