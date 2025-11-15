/**
 * Basic LangChain + TokenWise Integration Example
 * 
 * This example demonstrates the simplest way to add cost tracking
 * to your existing LangChain ChatOpenAI usage.
 */

import { ChatOpenAI } from "@langchain/openai";
import { monitorChatOpenAI } from "../src/index.js";
import dotenv from "dotenv";

(async () => {
  try {
    dotenv.config();

    console.log("🚀 Testing LangChain + TokenWise integration...");
    console.log("=" .repeat(50));

    // 1. Create your regular ChatOpenAI model
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
      temperature: 0.7,
    });

    // 2. Wrap it with TokenWise monitoring
    const monitoredModel = await monitorChatOpenAI(model, {
      database: { type: "sqlite" }, // Uses local SQLite by default
      metadata: {
        example: "langchain-basic",
        userId: "test-user",
        feature: "basic-chat",
        integration: "langchain" // Add integration type to metadata
      }
    });

    console.log("📝 Testing basic invoke...");
    
    // 3. Use exactly like regular ChatOpenAI - monitoring is automatic!
    const response = await monitoredModel.invoke(
      "Write a haiku about artificial intelligence in exactly 3 lines."
    );

    console.log("🤖 Response:", response.content);
    console.log("✅ Basic invoke completed and logged!");

    console.log("\n📝 Testing streaming...");
    
    // 4. Test streaming - also automatically monitored
    const stream = await monitoredModel.stream(
      "Count from 1 to 5, explaining each number briefly."
    );

    console.log("🔄 Streaming response:");
    for await (const chunk of stream) {
      process.stdout.write(chunk.content);
    }

    console.log("\n✅ Streaming completed and logged!");
    console.log("\n💡 Check your SQLite database (llm-logs.db) for the logged sessions");
    console.log("📊 Both requests were automatically tracked for cost and token usage!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
})();
