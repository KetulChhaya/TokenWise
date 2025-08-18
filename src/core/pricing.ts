// OpenAI Pricing: Pricing should be in USD per 1M tokens.
export const OPENAI_PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4": {
    input: 30,
    output: 60,
  },
  "gpt-4o": {
    input: 5,
    output: 15,
  },
  "gpt-4o-mini": {
    input: 0.15,
    output: 0.6,
  },
  "gpt-4-32k": {
    input: 60,
    output: 120,
  },
  "gpt-3.5-turbo": {
    input: 0.5,
    output: 1.5,
  },
  "gpt-3.5-turbo-16k": {
    input: 3,
    output: 4,
  },
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
