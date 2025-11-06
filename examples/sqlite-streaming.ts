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

    console.log("Testing SQLite streaming support...");
    console.log("=" .repeat(50));

    // Test streaming with monitoring
    const stream = await (monitoredOpenAI as any).chat.completions.create(
      {
        model: "gpt-3.5-turbo",
        messages: [
          { 
            role: "user", 
            content: "Write a short story about a robot learning to paint." 
          }
        ],
        stream: true, // Enable streaming
        max_tokens: 200
      },
      undefined, // No request options
      {
        metadata: {
          userId: "sqlite-streaming-user",
          sessionId: "sqlite-streaming-session-123",
          feature: "sqlite-story-generation",
          database: "sqlite",
        },
      }
    );

    console.log("📝 Streaming response:");
    console.log("-".repeat(30));

    // Process the stream
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        process.stdout.write(content); // Write without newline for streaming effect
      }
    }

    console.log("\n" + "-".repeat(30));
    console.log("SQLite streaming completed!");
    console.log("Check your SQLite database 'llm-logs.db' for the logged session");
    console.log("💡 The final cost and token usage will be logged to SQLite when the stream completes");

  } catch (error) {
    console.error("SQLite streaming test failed:", error);
  }
})();
