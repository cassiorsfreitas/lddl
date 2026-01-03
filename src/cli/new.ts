import { input } from "@inquirer/prompts";
import { createDecision } from "../core/decision.js";

export const newCommand = async (options: { title?: string }) => {
  let title = options.title;

  if (!title) {
    title = await input({
      message: "Decision title:",
    });
  }

  await createDecision({ title });
};
