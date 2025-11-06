import "dotenv/config";
import OpenAI from "openai";
import { monitor } from "../src/core/monitor.js";

async function testSQLiteMonitoring() {
  console.log("🗄️  Testing SQLite Monitoring...");
  console.log("=" .repeat(50));
  
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  // Create monitored OpenAI client with SQLite
  const monitoredOpenAI = await monitor(openai, {
    database: {
      type: "sqlite"
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
        test_type: "sqlite_monitoring",
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
    
    console.log("\n🎉 SQLite test completed!");
    console.log("📊 Check llm-logs.db file for logged entries");
    
  } catch (error) {
    console.error("❌ SQLite test failed:", error);
    throw error;
  }
}

// Run the test
testSQLiteMonitoring().catch(console.error);
