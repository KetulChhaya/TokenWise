// import OpenAI from "openai";
// import { monitor } from "../src/index.js";
// import dotenv from "dotenv";

// (async () => {
//   try {
//     dotenv.config();

//     const openai = new OpenAI({
//       apiKey: process.env.OPENAI_API_KEY,
//     });

//     // Firebase streaming monitoring with Admin SDK configuration
//     const monitoredOpenAI = await monitor(openai, {
//       database: {
//         type: "firebase",
//         firebase: {
//           projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
//           collection: "streaming_logs",
//           // Recommended: Use environment variables for credentials
//           clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//           privateKey: process.env.FIREBASE_PRIVATE_KEY,
//           // Alternative options:
//           // serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH, // File path
//           // serviceAccount: { ... }, // Full service account object
//           // Or use GOOGLE_APPLICATION_CREDENTIALS environment variable (no additional config needed)
//         }
//       }
//     });

//     console.log("🚀 Testing Firebase streaming support...");
//     console.log("=" .repeat(50));

//     // Test streaming with monitoring
//     const stream = await (monitoredOpenAI as any).chat.completions.create(
//       {
//         model: "gpt-3.5-turbo",
//         messages: [
//           { 
//             role: "user", 
//             content: "Write a short story about a robot learning to paint." 
//           }
//         ],
//         stream: true, // Enable streaming
//         max_tokens: 200
//       },
//       undefined, // No request options
//       {
//         metadata: {
//           userId: "firebase-streaming-user",
//           sessionId: "firebase-streaming-session-123",
//           feature: "firebase-story-generation",
//           database: "firebase",
//         },
//       }
//     );

//     console.log("📝 Streaming response:");
//     console.log("-".repeat(30));

//     // Process the stream
//     for await (const chunk of stream) {
//       const content = chunk.choices[0]?.delta?.content;
//       if (content) {
//         process.stdout.write(content); // Write without newline for streaming effect
//       }
//     }

//     console.log("\n" + "-".repeat(30));
//     console.log("✅ Firebase streaming completed!");
//     console.log("📊 Check your Firebase collection 'streaming_logs' for the logged session");
//     console.log("💡 The final cost and token usage will be logged to Firebase when the stream completes");

//   } catch (error) {
//     console.error("❌ Firebase streaming test failed:", error);
//   }
// })();
