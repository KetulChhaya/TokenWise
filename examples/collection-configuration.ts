/**
 * Collection Configuration Examples
 * 
 * This example demonstrates how to configure custom collection/table names
 * across all database types (SQLite, Firebase, MongoDB) for both OpenAI and LangChain.
 */

import OpenAI from "openai";
import { ChatOpenAI } from "@langchain/openai";
import { monitor, monitorChatOpenAI } from "../src/index.js";
import dotenv from "dotenv";

(async () => {
  try {
    dotenv.config();

    console.log("🗂️  Testing Collection Configuration Options...");
    console.log("=" .repeat(60));

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const langchainModel = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
    });

    // ===== SQLite Configuration Examples =====
    console.log("\n📊 SQLite Configuration Examples:");
    console.log("-" .repeat(40));

    // 1. Default SQLite (uses "llm_logs" table in "llm-logs.db")
    console.log("1️⃣  Default SQLite configuration:");
    const defaultSQLite = await monitor(openai, {
      database: { type: "sqlite" },
      metadata: { example: "default-sqlite", integration: "openai-direct" }
    });

    // 2. Custom SQLite filename and table
    console.log("2️⃣  Custom SQLite filename and table:");
    const customSQLite = await monitor(openai, {
      database: { 
        type: "sqlite",
        sqlite: {
          filename: "my-app-logs.db",
          tableName: "openai_usage"
        }
      },
      metadata: { example: "custom-sqlite", integration: "openai-direct" }
    });

    // 3. LangChain with custom SQLite table
    console.log("3️⃣  LangChain with custom SQLite table:");
    const langchainSQLite = await monitorChatOpenAI(langchainModel, {
      database: { 
        type: "sqlite",
        sqlite: {
          filename: "langchain-logs.db",
          tableName: "langchain_usage"
        }
      },
      metadata: { example: "langchain-sqlite", integration: "langchain" }
    });

    // ===== Firebase Configuration Examples =====
    console.log("\n🔥 Firebase Configuration Examples:");
    console.log("-" .repeat(40));

    // 4. Default Firebase (uses "llm_logs" collection)
    console.log("4️⃣  Default Firebase configuration:");
    const defaultFirebase = await monitor(openai, {
      database: { 
        type: "firebase",
        firebase: {
          projectId: process.env.FIREBASE_PROJECT_ID!,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY,
          // collection not specified - defaults to "llm_logs"
        }
      },
      metadata: { example: "default-firebase", integration: "openai-direct" }
    });

    // 5. Custom Firebase collection for OpenAI
    console.log("5️⃣  Custom Firebase collection for OpenAI:");
    const customFirebaseOpenAI = await monitor(openai, {
      database: { 
        type: "firebase",
        firebase: {
          projectId: process.env.FIREBASE_PROJECT_ID!,
          collection: "openai_direct_logs",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY,
        }
      },
      metadata: { example: "custom-firebase-openai", integration: "openai-direct" }
    });

    // 6. Custom Firebase collection for LangChain
    console.log("6️⃣  Custom Firebase collection for LangChain:");
    const customFirebaseLangChain = await monitorChatOpenAI(langchainModel, {
      database: { 
        type: "firebase",
        firebase: {
          projectId: process.env.FIREBASE_PROJECT_ID!,
          collection: "langchain_chat_logs",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY,
        }
      },
      metadata: { example: "custom-firebase-langchain", integration: "langchain" }
    });

    // ===== MongoDB Configuration Examples =====
    console.log("\n🍃 MongoDB Configuration Examples:");
    console.log("-" .repeat(40));

    // 7. Default MongoDB (uses "llm_logs" collection)
    console.log("7️⃣  Default MongoDB configuration:");
    const defaultMongoDB = await monitor(openai, {
      database: { 
        type: "mongodb",
        mongodb: {
          connectionUrl: process.env.MONGODB_CONNECTION_URL!,
          database: "tokenwise",
          // collection not specified - defaults to "llm_logs"
        }
      },
      metadata: { example: "default-mongodb", integration: "openai-direct" }
    });

    // 8. Custom MongoDB collection for OpenAI
    console.log("8️⃣  Custom MongoDB collection for OpenAI:");
    const customMongoDBOpenAI = await monitor(openai, {
      database: { 
        type: "mongodb",
        mongodb: {
          connectionUrl: process.env.MONGODB_CONNECTION_URL!,
          database: "tokenwise",
          collection: "openai_api_logs"
        }
      },
      metadata: { example: "custom-mongodb-openai", integration: "openai-direct" }
    });

    // 9. Custom MongoDB collection for LangChain
    console.log("9️⃣  Custom MongoDB collection for LangChain:");
    const customMongoDBLangChain = await monitorChatOpenAI(langchainModel, {
      database: { 
        type: "mongodb",
        mongodb: {
          connectionUrl: process.env.MONGODB_CONNECTION_URL!,
          database: "tokenwise",
          collection: "langchain_interactions"
        }
      },
      metadata: { example: "custom-mongodb-langchain", integration: "langchain" }
    });

    // ===== Environment-Based Configuration =====
    console.log("\n🌍 Environment-Based Configuration:");
    console.log("-" .repeat(40));

    // 10. Environment-based collection names
    console.log("🔟 Environment-based collection names:");
    const env = process.env.NODE_ENV || 'development';
    const envBasedConfig = await monitor(openai, {
      database: { 
        type: "firebase",
        firebase: {
          projectId: process.env.FIREBASE_PROJECT_ID!,
          collection: `llm_logs_${env}`, // e.g., "llm_logs_production"
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY,
        }
      },
      metadata: { 
        example: "env-based-config", 
        integration: "openai-direct",
        environment: env
      }
    });

    // ===== Test All Configurations =====
    console.log("\n🧪 Testing All Configurations:");
    console.log("-" .repeat(40));

    const testMessage = "Hello! This is a test message for collection configuration.";

    // Test a few configurations with actual API calls
    console.log("Testing default SQLite...");
    await defaultSQLite.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: testMessage }],
      max_tokens: 10
    });

    console.log("Testing LangChain with custom SQLite...");
    await langchainSQLite.invoke(testMessage);

    console.log("Testing environment-based Firebase...");
    await envBasedConfig.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [{ role: "user", content: testMessage }],
      max_tokens: 10
    });

    console.log("\n✅ All collection configurations tested successfully!");
    console.log("\n📊 Check your databases for logs in the configured collections/tables:");
    console.log("   • SQLite: llm-logs.db (llm_logs), my-app-logs.db (openai_usage), langchain-logs.db (langchain_usage)");
    console.log("   • Firebase: llm_logs, openai_direct_logs, langchain_chat_logs, llm_logs_" + env);
    console.log("   • MongoDB: llm_logs, openai_api_logs, langchain_interactions");

  } catch (error) {
    console.error("❌ Collection configuration test failed:", error);
  }
})();
