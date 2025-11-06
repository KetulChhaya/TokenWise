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
    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error("FIREBASE_PROJECT_ID environment variable is required");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Firebase monitoring with Admin SDK configuration
    const monitoredOpenAI = await monitor(openai, {
      database: {
        type: "firebase",
        firebase: {
          projectId: process.env.FIREBASE_PROJECT_ID,
          collection: "openai_logs",
          // Recommended: Use environment variables for credentials
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY,
          // Alternative options:
          // serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH, // File path
          // serviceAccount: { ... }, // Full service account object
          // Or use GOOGLE_APPLICATION_CREDENTIALS environment variable (no additional config needed)
        }
      }
    });

    console.log("Testing Firebase basic monitoring...");
    console.log("=" .repeat(50));

    const response = await (monitoredOpenAI as any).chat.completions.create(
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello!" }],
      },
      undefined,
      {
        metadata: {
          userId: "firebase-user-123",
          sessionId: "firebase-session-abc",
          feature: "firebase-greeting-bot",
        },
      }
    );

    console.log("API call successful:", response.choices[0]?.message);

    // Make another call with different metadata
    await (monitoredOpenAI as any).chat.completions.create(
      {
        model: "gpt-4o",
        messages: [{ role: "user", content: "Tell me a joke" }],
      },
      undefined,
      {
        metadata: {
          userId: "firebase-user-456",
          sessionId: "firebase-session-def",
          feature: "firebase-joke-bot",
        },
      }
    );

    console.log("Made two API calls with different users.");
    console.log("Logs have been automatically inserted into Firebase collection.");
    
  } catch (error) {
    console.error("Firebase API call failed:", error);
  }
})();
