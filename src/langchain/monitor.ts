import { monitor } from "../core/monitor.js";
import type { MonitorOptions } from "../types.js";

// Type definitions for LangChain (to avoid requiring the dependency at build time)
interface ChatOpenAI {
  openAIApiKey?: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  n?: number;
  streaming?: boolean;
  invoke(input: string): Promise<any>;
  stream(input: string): AsyncIterable<any>;
}

/**
 * Monitor a LangChain ChatOpenAI instance for cost and token tracking
 * 
 * @param chatOpenAI - The ChatOpenAI instance to monitor
 * @param options - Optional monitoring configuration (database, metadata)
 * @returns A new ChatOpenAI instance with monitoring enabled
 * 
 * @example
 * ```typescript
 * import { ChatOpenAI } from "@langchain/openai";
 * import { monitorChatOpenAI } from "tokenwise-tracker";
 * 
 * const model = new ChatOpenAI({
 *   openAIApiKey: process.env.OPENAI_API_KEY,
 *   modelName: "gpt-4o-mini",
 * });
 * 
 * const monitoredModel = await monitorChatOpenAI(model, {
 *   database: { type: "sqlite" },
 *   metadata: { userId: "user123" }
 * });
 * 
 * // Use exactly like regular ChatOpenAI
 * const response = await monitoredModel.invoke("Hello!");
 * ```
 */
export const monitorChatOpenAI = async (
  chatOpenAI: any, // Use any to avoid requiring LangChain at build time
  options?: MonitorOptions
): Promise<any> => {
  // Validate input
  if (!chatOpenAI) {
    throw new Error("ChatOpenAI instance is required");
  }

  // Runtime validation to ensure it's a LangChain ChatOpenAI instance
  if (typeof chatOpenAI.invoke !== 'function' || typeof chatOpenAI.stream !== 'function') {
    throw new Error("Invalid ChatOpenAI instance: missing invoke or stream methods");
  }

  // Extract the underlying OpenAI client from ChatOpenAI
  // ChatOpenAI stores it in the 'client' property
  const originalClient = (chatOpenAI as any).client;
  
  if (!originalClient) {
    throw new Error("Could not access OpenAI client from ChatOpenAI instance");
  }

  // Monitor the OpenAI client using existing tokenwise infrastructure
  const monitoredClient = await monitor(originalClient, options);

  // Create a new ChatOpenAI instance with the monitored client
  // We'll clone the original configuration and inject the monitored client
  const originalConfig = {
    openAIApiKey: chatOpenAI.openAIApiKey,
    modelName: chatOpenAI.modelName,
    temperature: chatOpenAI.temperature,
    maxTokens: chatOpenAI.maxTokens,
    topP: chatOpenAI.topP,
    frequencyPenalty: chatOpenAI.frequencyPenalty,
    presencePenalty: chatOpenAI.presencePenalty,
    n: chatOpenAI.n,
    streaming: chatOpenAI.streaming,
    // Copy any other configuration properties
    ...(chatOpenAI as any).fields,
  };

  // Create new ChatOpenAI instance using the same constructor
  const ChatOpenAIConstructor = chatOpenAI.constructor;
  const monitoredChatOpenAI = new ChatOpenAIConstructor(originalConfig);

  // Replace the client with our monitored version
  (monitoredChatOpenAI as any).client = monitoredClient;

  return monitoredChatOpenAI;
};
