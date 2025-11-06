import OpenAI from "openai";
import { monitor } from "../src/index.js";
import dotenv from "dotenv";

(async () => {
  try {
    dotenv.config();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("🔧 Firebase Environment Setup Example");
    console.log("=" .repeat(50));

    // Check if required environment variables are set
    const requiredEnvVars = [
      'OPENAI_API_KEY',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_CLIENT_EMAIL',
      'FIREBASE_PRIVATE_KEY'
    ];

    console.log("📋 Checking environment variables:");
    requiredEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      if (value) {
        console.log(`✅ ${envVar}: ${envVar.includes('KEY') ? '***' : value}`);
      } else {
        console.log(`❌ ${envVar}: Not set`);
      }
    });

    // Firebase monitoring with environment variables
    const monitoredOpenAI = await monitor(openai, {
      database: {
        type: "firebase",
        firebase: {
          projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
          collection: "env_test_logs",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY,
        }
      }
    });

    console.log("\n🚀 Testing Firebase with environment variables...");

    const response = await (monitoredOpenAI as any).chat.completions.create(
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello from environment setup!" }],
      },
      undefined,
      {
        metadata: {
          userId: "env-test-user",
          sessionId: "env-test-session",
          feature: "firebase-env-test",
          environment: "development",
        },
      }
    );

    console.log("✅ Environment test successful:", response.choices[0]?.message);
    console.log("📊 Check your Firebase collection 'env_test_logs' for the logged session");

    console.log("\n💡 Environment Variables Setup:");
    console.log("Create a .env file in your project root with:");
    console.log("OPENAI_API_KEY=your_openai_api_key");
    console.log("FIREBASE_PROJECT_ID=your_firebase_project_id");
    console.log("FIREBASE_CLIENT_EMAIL=your_firebase_client_email");
    console.log("FIREBASE_PRIVATE_KEY=your_firebase_private_key");
    
  } catch (error) {
    console.error("❌ Environment setup test failed:", error);
    console.log("\n💡 Make sure you have set up your .env file with the required variables");
  }
})();
