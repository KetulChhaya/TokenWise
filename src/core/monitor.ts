import OpenAI from "openai";
import type {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParams,
} from "openai/resources/chat/completions";
import { Stream } from "openai/streaming";
import { calculateCost } from "./pricing.js";
import type { LogRecord, MonitorOptions } from "../types.js";
import { StreamWrapper } from "./stream-wrapper.js";

// Import database handlers directly
import { createSQLiteHandler } from "../db/sqlite.js";
import { createFirebaseHandler } from "../db/firebase.js";
import { createMongoDBHandler } from "../db/mongodb.js";

// Database handlers - completely separate
let sqliteHandler: any = null;
let firebaseHandler: any = null;
let mongodbHandler: any = null;

// Validation functions
function validateFirebaseConfig(config: any): void {
  if (!config) {
    throw new Error("Firebase configuration is required when using Firebase database");
  }
  if (!config.projectId) {
    throw new Error("Firebase projectId is required");
  }
  if (!config.collection) {
    throw new Error("Firebase collection name is required");
  }
}

function validateMongoDBConfig(config: any): void {
  if (!config) {
    throw new Error("MongoDB configuration is required when using MongoDB database");
  }
  if (!config.connectionUrl) {
    throw new Error("MongoDB connectionUrl is required");
  }
  if (!config.database) {
    throw new Error("MongoDB database name is required");
  }
  if (!config.collection) {
    throw new Error("MongoDB collection name is required");
  }
}

export const monitor = async (openai: OpenAI, monitorOptions?: MonitorOptions): Promise<OpenAI> => {
  // Validate OpenAI client
  if (!openai) {
    throw new Error("OpenAI client is required");
  }

  const databaseType = monitorOptions?.database?.type || "sqlite";
  
  // Initialize the appropriate database handler
  if (databaseType === "firebase") {
    validateFirebaseConfig(monitorOptions?.database?.firebase);
    if (!firebaseHandler) {
      firebaseHandler = createFirebaseHandler(monitorOptions?.database?.firebase!);
      if (!firebaseHandler) {
        throw new Error("Failed to initialize Firebase handler");
      }
    }
  } else if (databaseType === "mongodb") {
    validateMongoDBConfig(monitorOptions?.database?.mongodb);
    if (!mongodbHandler) {
      mongodbHandler = createMongoDBHandler(monitorOptions?.database?.mongodb!);
      if (!mongodbHandler) {
        throw new Error("Failed to initialize MongoDB handler");
      }
    }
  } else if (databaseType === "sqlite") {
    if (!sqliteHandler) {
      sqliteHandler = await createSQLiteHandler();
    }
  } else {
    throw new Error(`Unsupported database type: ${databaseType}. Supported types are: sqlite, firebase, mongodb`);
  }

  // Get the appropriate handler
  const databaseHandler = databaseType === "firebase" 
    ? firebaseHandler 
    : databaseType === "mongodb" 
    ? mongodbHandler 
    : sqliteHandler;

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
                        requestOptions?: OpenAI.RequestOptions | undefined,
                        monitorOptions?: { metadata?: Record<string, any> }
                      ]
                    ): Promise<ChatCompletion | Stream<ChatCompletionChunk>> {
                      const startTime = Date.now();
                      const [body, requestOptions, monitorOptions] = args;
                      const metadata = monitorOptions?.metadata;

                      try {
                        const response = await originalCreate.apply(
                          completionsTarget,
                          [body, requestOptions]
                        );
                        const latency = Date.now() - startTime;

                        if (response instanceof Stream) {
                          // Create a StreamWrapper to track streaming responses
                          const streamWrapper = new StreamWrapper(response, {
                            model: body.model,
                            startTime,
                            messages: body.messages, // Pass messages for input token estimation
                            metadata: metadata || undefined,
                            onToken: (token, runningCost) => {
                              // Optional: Allow users to track tokens in real-time
                              // This could be extended to support custom callbacks
                            },
                            onComplete: (log) => {
                              // Log the final result when stream completes
                              databaseHandler.insertLog(log);
                            }
                          });
                          return streamWrapper as any; // Type assertion for now
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
                            ...(metadata && { metadata }),
                          };
                          databaseHandler.insertLog(log);
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
                        databaseHandler.insertLog(log);

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
