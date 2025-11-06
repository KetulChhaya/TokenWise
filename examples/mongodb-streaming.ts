import OpenAI from "openai";
import { monitor } from "../src/index.js";
import dotenv from "dotenv";

(async () => {
  try {
    dotenv.config();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // MongoDB monitoring for streaming responses
    const monitoredOpenAI = await monitor(openai, {
      database: {
        type: "mongodb",
        mongodb: {
          connectionUrl: process.env.MONGODB_CONNECTION_URL || "mongodb+srv://username:password@cluster.mongodb.net/",
          database: process.env.MONGODB_DATABASE || "tokenwise",
          collection: "streaming_logs",
        }
      }
    });

    console.log("Testing MongoDB streaming monitoring...");
    console.log("=" .repeat(50));

    // Test streaming response
    const stream = await (monitoredOpenAI as any).chat.completions.create(
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Write a short poem about databases" }],
        stream: true,
      },
      undefined,
      {
        metadata: {
          userId: "mongodb-stream-user-789",
          sessionId: "mongodb-stream-session-xyz",
          feature: "mongodb-streaming-bot",
          requestType: "streaming",
        },
      }
    );

    console.log("Streaming response:");
    let fullResponse = "";
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        process.stdout.write(content);
        fullResponse += content;
      }
    }

    console.log("\n\nStreaming completed!");
    console.log("Stream metrics have been automatically logged to MongoDB.");
    console.log(`Full response length: ${fullResponse.length} characters`);

    // Test another streaming call with different metadata
    console.log("\nTesting second streaming call...");
    
    const stream2 = await (monitoredOpenAI as any).chat.completions.create(
      {
        model: "gpt-4o",
        messages: [{ role: "user", content: "Explain MongoDB in one sentence" }],
        stream: true,
      },
      undefined,
      {
        metadata: {
          userId: "mongodb-stream-user-101",
          sessionId: "mongodb-stream-session-202",
          feature: "mongodb-explanation-bot",
          requestType: "streaming",
        },
      }
    );

    console.log("Second streaming response:");
    for await (const chunk of stream2) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        process.stdout.write(content);
      }
    }

    console.log("\n\nBoth streaming calls completed successfully!");
    console.log("All streaming metrics logged to MongoDB collection.");
    
  } catch (error) {
    console.error("MongoDB streaming test failed:", error);
  }
})();
