import OpenAI from "openai";
import { monitor } from "../src/index.js";
import dotenv from "dotenv";

(async () => {
  try {
    dotenv.config();

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("MongoDB Configuration Examples");
    console.log("=" .repeat(50));

    // Example 1: MongoDB Atlas with environment variables (Recommended)
    console.log("Example 1: MongoDB Atlas with Environment Variables");
    const monitoredOpenAI1 = await monitor(openai, {
      database: {
        type: "mongodb",
        mongodb: {
          connectionUrl: process.env.MONGODB_CONNECTION_URL || "mongodb+srv://your-username:your-password@your-cluster.mongodb.net/",
          database: process.env.MONGODB_DATABASE || "tokenwise",
          collection: "openai_logs",
        }
      }
    });

    // Example 2: MongoDB Atlas with custom connection options
    console.log("Example 2: MongoDB Atlas with Custom Options");
    const monitoredOpenAI2 = await monitor(openai, {
      database: {
        type: "mongodb",
        mongodb: {
          connectionUrl: process.env.MONGODB_CONNECTION_URL || "mongodb+srv://your-username:your-password@your-cluster.mongodb.net/",
          database: "tokenwise_production",
          collection: "llm_usage_logs",
          options: {
            maxPoolSize: 20,
            minPoolSize: 5,
            maxIdleTimeMS: 60000,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 15000,
          }
        }
      }
    });

    // Example 3: Local MongoDB instance
    console.log("Example 3: Local MongoDB Instance");
    const monitoredOpenAI3 = await monitor(openai, {
      database: {
        type: "mongodb",
        mongodb: {
          connectionUrl: "mongodb://localhost:27017",
          database: "tokenwise_local",
          collection: "openai_logs",
          options: {
            maxPoolSize: 5,
            minPoolSize: 1,
          }
        }
      }
    });

    // Example 4: MongoDB Atlas with authentication parameters in URL
    console.log("Example 4: MongoDB Atlas with Full Connection String");
    const monitoredOpenAI4 = await monitor(openai, {
      database: {
        type: "mongodb",
        mongodb: {
          connectionUrl: "mongodb+srv://your-username:your-password@your-cluster.mongodb.net/your-database?retryWrites=true&w=majority",
          database: "tokenwise",
          collection: "api_logs",
        }
      }
    });

    console.log("All MongoDB configuration examples loaded successfully!");
    console.log("Choose the configuration method that works best for your setup");

    // Test with the first configuration
    const response = await (monitoredOpenAI1 as any).chat.completions.create(
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello from MongoDB config example!" }],
      },
      undefined,
      {
        metadata: {
          userId: "config-test-user",
          sessionId: "config-test-session",
          feature: "mongodb-config-test",
          environment: "development",
        },
      }
    );

    console.log("Test API call successful:", response.choices[0]?.message);
    
  } catch (error) {
    console.error("MongoDB configuration test failed:", error);
  }
})();
