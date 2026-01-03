import { input } from "@inquirer/prompts";
import { createDecision, DecisionInput } from "../core/decision.js";

export const newCommand = async (options: DecisionInput) => {
  const decisionInput: DecisionInput = {
    title: options.title || (await input({ message: "Decision title:" })),
  };

  if (!options.context) {
    const contextInput = await input({
      message: "Context (optional, press Enter to skip):",
      default: "",
    });
    if (contextInput) decisionInput.context = contextInput;
  } else {
    decisionInput.context = options.context;
  }

  if (!options.decision) {
    const decisionText = await input({
      message: "Decision (optional, press Enter to skip):",
      default: "",
    });
    if (decisionText) decisionInput.decision = decisionText;
  } else {
    decisionInput.decision = options.decision;
  }

  if (!options.consequences) {
    const consequencesInput = await input({
      message: "Consequences (optional, press Enter to skip):",
      default: "",
    });
    if (consequencesInput) decisionInput.consequences = consequencesInput;
  } else {
    decisionInput.consequences = options.consequences;
  }

  await createDecision(decisionInput);
};
