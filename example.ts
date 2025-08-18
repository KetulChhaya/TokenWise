import OpenAI from "openai";
import { monitor, initializeDatabase } from "./src/index.js";
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
  } catch (error) {
    console.error("API call failed:", error);
  }
})();
