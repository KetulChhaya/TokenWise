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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // SQLite monitoring (default database)
    const monitoredOpenAI = await monitor(openai);

    console.log("Testing SQLite basic monitoring...");
    console.log("=" .repeat(50));

    const response = await (monitoredOpenAI as any).chat.completions.create(
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello world" }],
      },
      undefined, // No request options
      {
        metadata: {
          userId: "user-123",
          sessionId: "session-abc",
          feature: "greeting-bot",
        },
      }
    );
    console.log("API call successful:", response.choices[0]?.message);

    // Make another call with a different user
    await (monitoredOpenAI as any).chat.completions.create(
      {
        model: "gpt-4o",
        messages: [{ role: "user", content: "Tell me a joke" }],
      },
      undefined,
      {
        metadata: {
          userId: "user-456",
          sessionId: "session-def",
          feature: "joke-bot",
        },
      }
    );

    console.log("Made two API calls with different users.");
    console.log("Logs have been automatically inserted into SQLite database.");
    
  } catch (error) {
    console.error("API call failed:", error);
  }
})();
