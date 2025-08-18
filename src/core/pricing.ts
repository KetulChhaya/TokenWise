// OpenAI Pricing: Pricing as per the OpenAI API documentation in USD per 1M tokens.
export const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-5-mini": { input: 0.25, output: 2.0 },
  "gpt-5-nano": { input: 0.05, output: 0.4 },
  "gpt-5": { input: 1.25, output: 10.0 },
  "gpt-4.1-mini": { input: 0.8, output: 3.2 },
  "gpt-4.1-nano": { input: 0.2, output: 0.8 },
  "gpt-4.1": { input: 3.0, output: 12.0 },
  "gpt-4o-mini": { input: 0.6, output: 2.4 },
  "gpt-4o": { input: 5.0, output: 20.0 },
  "gpt-4.5": { input: 75.0, output: 150.0 },
  "o1-pro": { input: 150.0, output: 600.0 },

  // Legacy Models (for matching older versions)
  "gpt-4-32k": { input: 60, output: 120 },
  "gpt-4": { input: 30, output: 60 },
  "gpt-3.5-turbo-16k": { input: 3, output: 4 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
};

export const findModel = (
  model: string
): { input: number; output: number } | undefined => {
  const modelKeys = Object.keys(OPENAI_PRICING).sort(
    (a, b) => b.length - a.length
  );
  const matchedKey = modelKeys.find((key) => model.startsWith(key));

  if (!matchedKey) {
    return undefined;
  }
  return OPENAI_PRICING[matchedKey];
};

export const calculateCost = (
  model: string,
  inputTokens: number,
  outputTokens: number
): number | null => {
  const pricing = findModel(model);

  if (!pricing) {
    console.warn(
      `Pricing for model ${model} not found. Cost will not be calculated.`
    );
    return null;
  }

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
};
