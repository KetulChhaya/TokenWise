import OpenAI from "openai";
import {
  monitor,
  initializeDatabase,
  getLogs,
  getCostSummary,
} from "../src/index.js";
import dotenv from "dotenv";

(async () => {
  try {
    dotenv.config();
    initializeDatabase();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const monitoredOpenAI = monitor(openai);

    const response = await (
      monitoredOpenAI as any
    ).chat.completions.create(
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello world" }],
      },
      undefined, // No options needed here
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

    // --- Programmatic API Usage ---
    console.log("\n--- Analytics ---");

    // 1. Get all logs
    const allLogs = getLogs();
    console.log(`Total logs found: ${allLogs.length}`);

    // 2. Get total cost
    const totalCost = getCostSummary();
    console.log(`Total cost: $${totalCost.totalCost.toFixed(6)}`);

    // 3. Get cost grouped by user
    const costByUser = getCostSummary({ groupBy: "userId" });
    console.log("Cost by user:", costByUser);
    
  } catch (error) {
    console.error("API call failed:", error);
  }
})();
