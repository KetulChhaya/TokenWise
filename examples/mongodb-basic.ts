import OpenAI from "openai";
import { monitor } from "../src/index.js";
import dotenv from "dotenv";

(async () => {
  try {
    dotenv.config();

    // Validate required environment variables
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    if (!process.env.MONGODB_CONNECTION_URL) {
      throw new Error("MONGODB_CONNECTION_URL environment variable is required");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // MongoDB monitoring with Atlas connection
    const monitoredOpenAI = await monitor(openai, {
      database: {
        type: "mongodb",
        mongodb: {
          connectionUrl: process.env.MONGODB_CONNECTION_URL,
          database: process.env.MONGODB_DATABASE || "tokenwise",
          collection: "openai_logs",
        }
      }
    });

    console.log("Testing MongoDB basic monitoring...");
    console.log("=" .repeat(50));

    const response = await (monitoredOpenAI as any).chat.completions.create(
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello from MongoDB!" }],
      },
      undefined,
      {
        metadata: {
          userId: "mongodb-user-123",
          sessionId: "mongodb-session-abc",
          feature: "mongodb-greeting-bot",
        },
      }
    );

    console.log("API call successful:", response.choices[0]?.message);

    // Make another call with different metadata
    await (monitoredOpenAI as any).chat.completions.create(
      {
        model: "gpt-4o",
        messages: [{ role: "user", content: "Tell me about MongoDB Atlas" }],
      },
      undefined,
      {
        metadata: {
          userId: "mongodb-user-456",
          sessionId: "mongodb-session-def",
          feature: "mongodb-info-bot",
        },
      }
    );

    console.log("Made two API calls with different users.");
    console.log("Logs have been automatically inserted into MongoDB collection.");
    
  } catch (error) {
    console.error("MongoDB API call failed:", error);
  }
})();
