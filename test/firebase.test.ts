import "dotenv/config";
import OpenAI from "openai";
import { monitor } from "../src/core/monitor.js";

async function testFirebaseMonitoring() {
  console.log("🔥 Testing Firebase Monitoring...");
  console.log("=" .repeat(50));
  
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  // Create monitored OpenAI client with Firebase
  const monitoredOpenAI = await monitor(openai, {
    database: {
      type: "firebase",
      firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID!,
        collection: process.env.FIREBASE_COLLECTION || "llm_logs",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!
      }
    }
  });

  try {
    console.log("📝 Making monitored API call...");
    const response = await (monitoredOpenAI.chat.completions.create as any)({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Tell me a short programming joke"
        }
      ],
      max_tokens: 100
    }, undefined, {
      metadata: {
        test_type: "firebase_monitoring",
        environment: "test",
        user_id: "test_user"
      }
    });

    console.log("✅ Monitored call successful!");
    console.log("📝 Response:", response.choices[0]?.message?.content);
    console.log("📊 Usage:", response.usage);
    
    // Test original OpenAI (no monitoring)
    console.log("\n📝 Making original API call (no monitoring)...");
    const originalResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: "Tell me a short programming joke"
        }
      ],
      max_tokens: 100
    });

    console.log("✅ Original call successful!");
    console.log("📝 Response:", originalResponse.choices[0]?.message?.content);
    console.log("📊 Usage:", originalResponse.usage);
    
    console.log("\n🎉 Firebase test completed!");
    console.log("📊 Check Firestore llm_logs collection for logged entries");
    
  } catch (error) {
    console.error("❌ Firebase test failed:", error);
    throw error;
  }
}

// Run the test
testFirebaseMonitoring().catch(console.error);
