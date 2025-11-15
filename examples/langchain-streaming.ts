/**
 * LangChain Streaming + TokenWise Integration Example
 * 
 * This example demonstrates how to use TokenWise monitoring with LangChain's
 * streaming capabilities for real-time token and cost tracking.
 */

import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { monitorChatOpenAI } from "../src/index.js";
import dotenv from "dotenv";

(async () => {
  try {
    dotenv.config();

    console.log("🌊 Testing LangChain Streaming + TokenWise integration...");
    console.log("=" .repeat(60));

    // 1. Create your regular ChatOpenAI model
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      streaming: true, // Enable streaming
    });

    // 2. Wrap it with TokenWise monitoring
    const monitoredModel = await monitorChatOpenAI(model, {
      database: { type: "sqlite" }, // Uses local SQLite by default
      metadata: {
        example: "langchain-streaming",
        userId: "test-user",
        feature: "streaming-chat",
        integration: "langchain"
      }
    });

    // 3. Create a prompt template
    const prompt = ChatPromptTemplate.fromTemplate(`
You are a creative storyteller. Write a short story about {topic}.
Make it engaging and include vivid descriptions.
Keep it to about 3-4 paragraphs.
    `);

    // 4. Create a chain with string output parser
    const outputParser = new StringOutputParser();
    const chain = prompt.pipe(monitoredModel).pipe(outputParser);

    console.log("📝 Testing LangChain streaming with prompt chain...");
    console.log("-" .repeat(50));

    // 5. Stream the response - TokenWise automatically tracks everything!
    console.log("🤖 AI Story (streaming):");
    console.log();

    const stream = await chain.stream({
      topic: "a robot learning to paint masterpieces"
    });

    let fullResponse = "";
    for await (const chunk of stream) {
      process.stdout.write(chunk); // Write without newline for streaming effect
      fullResponse += chunk;
    }

    console.log("\n" + "-" .repeat(50));
    console.log("✅ LangChain streaming completed!");

    console.log("\n📊 What was automatically tracked:");
    console.log("   • Input tokens (from the prompt template)");
    console.log("   • Output tokens (from the streaming response)");
    console.log("   • Cost calculation (based on gpt-4o-mini pricing)");
    console.log("   • Latency (request start to stream completion)");
    console.log("   • Custom metadata (userId, feature, integration type)");

    console.log("\n🔍 Testing another streaming example...");
    console.log("-" .repeat(50));

    // 6. Test with a different prompt
    const codePrompt = ChatPromptTemplate.fromTemplate(`
Write a Python function that {task}.
Include docstring and comments explaining the logic.
    `);

    const codeChain = codePrompt.pipe(monitoredModel).pipe(outputParser);

    console.log("💻 AI Code (streaming):");
    console.log();

    const codeStream = await codeChain.stream({
      task: "calculates the fibonacci sequence up to n terms"
    });

    for await (const chunk of codeStream) {
      process.stdout.write(chunk);
    }

    console.log("\n" + "-" .repeat(50));
    console.log("✅ Second streaming example completed!");

    console.log("\n💡 Check your SQLite database (llm-logs.db) for the logged sessions");
    console.log("📈 Both streaming requests were automatically tracked for:");
    console.log("   • Token usage and costs");
    console.log("   • Response latency");
    console.log("   • Success status");
    console.log("   • All custom metadata");

    console.log("\n🎯 Key Benefits:");
    console.log("   ✅ Zero code changes to your existing LangChain chains");
    console.log("   ✅ Automatic streaming support - no special handling needed");
    console.log("   ✅ Real-time cost tracking as tokens are generated");
    console.log("   ✅ Works with any LangChain chain pattern");

  } catch (error) {
    console.error("❌ LangChain streaming test failed:", error);
  }
})();
