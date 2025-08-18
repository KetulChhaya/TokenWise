import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
} from "openai/resources/chat/completions";
import { Stream } from "openai/streaming";
import { insertLog, initializeDatabase } from "../db/db.js";
import { calculateCost } from "./pricing.js";
import type { LogRecord } from "../types.js";

let isDatabaseInitialized = false;

export const monitor = (openai: OpenAI): OpenAI => {
  if (!isDatabaseInitialized) {
    initializeDatabase();
    isDatabaseInitialized = true;
  }

  return new Proxy(openai, {
    get(target, prop) {
      if (prop === "chat") {
        return new Proxy(target.chat, {
          get(chatTarget, chatProp) {
            if (chatProp === "completions") {
              return new Proxy(chatTarget.completions, {
                get(completionsTarget, completionsProp) {
                  if (completionsProp === "create") {
                    const originalCreate = completionsTarget.create;

                    return async function (
                      ...args: [
                        body: ChatCompletionCreateParams,
                        options?: OpenAI.RequestOptions | undefined,
                        monitorOptions?: { metadata?: Record<string, any> }
                      ]
                    ): Promise<ChatCompletion | Stream<ChatCompletionChunk>> {
                      const startTime = Date.now();
                      const [body, options, monitorOptions] = args;
                      const metadata = monitorOptions?.metadata;

                      try {
                        const response = await originalCreate.apply(
                          completionsTarget,
                          [body, options]
                        );
                        const latency = Date.now() - startTime;

                        if (response instanceof Stream) {
                          console.warn(
                            "Streaming responses are not yet supported for cost monitoring."
                          );
                          return response;
                        }

                        const { model, usage } = response;

                        if (usage) {
                          const { prompt_tokens, completion_tokens } = usage;
                          const cost = calculateCost(
                            model,
                            prompt_tokens,
                            completion_tokens
                          );

                          const log: LogRecord = {
                            timestamp: new Date().toISOString(),
                            provider: "openai",
                            model: model,
                            input_tokens: prompt_tokens,
                            output_tokens: completion_tokens,
                            ...(cost !== null && { cost }),
                            latency_ms: latency,
                            status: "SUCCESS",
                            error_message: null,
                            ...(metadata && { metadata }),
                          };
                          insertLog(log);
                        }

                        return response;
                      } catch (error: any) {
                        const latency = Date.now() - startTime;

                        const log: LogRecord = {
                          timestamp: new Date().toISOString(),
                          provider: "openai",
                          model: body.model,
                          input_tokens: undefined,
                          output_tokens: undefined,
                          cost: undefined,
                          latency_ms: latency,
                          status: "ERROR",
                          error_message: error.message,
                          ...(metadata && { metadata }),
                        };
                        insertLog(log);

                        throw error;
                      }
                    };
                  }
                  return Reflect.get(completionsTarget, completionsProp);
                },
              });
            }
            return Reflect.get(chatTarget, chatProp);
          },
        });
      }
      return Reflect.get(target, prop);
    },
  });
};
