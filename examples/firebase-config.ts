import OpenAI from "openai";
import { monitor } from "../src/index.js";

(async () => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log("🔧 Firebase Configuration Examples");
    console.log("=" .repeat(50));

    // Example 1: Plug-and-Play (Recommended - uses existing Firebase app)
    console.log("📝 Example 1: Plug-and-Play (Uses Existing Firebase App)");
    const monitoredOpenAI1 = await monitor(openai, {
      database: {
        type: "firebase",
        firebase: {
          projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
          collection: "openai_logs",
          // No credentials needed if Firebase already initialized!
          useExistingApp: true, // Default behavior
        }
      }
    });

    // Example 1b: Using environment variables (when creating new app)
    console.log("📝 Example 1b: Environment Variables (New App)");
    const monitoredOpenAI1b = await monitor(openai, {
      database: {
        type: "firebase",
        firebase: {
          projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
          collection: "openai_logs",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY,
          useExistingApp: false, // Force new app creation
        }
      }
    });

    // Example 2: Using service account key file
    console.log("📝 Example 2: Service Account Key File");
    const monitoredOpenAI2 = await monitor(openai, {
      database: {
        type: "firebase",
        firebase: {
          projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
          collection: "openai_logs",
          serviceAccountKey: process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH, // File path
        }
      }
    });

    // Example 3: Using full service account object
    console.log("📝 Example 3: Service Account Object");
    const monitoredOpenAI3 = await monitor(openai, {
      database: {
        type: "firebase",
        firebase: {
          projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
          collection: "openai_logs",
          serviceAccount: {
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID || "your-project-id",
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "your-private-key-id",
            private_key: process.env.FIREBASE_PRIVATE_KEY || "your-private-key",
            client_email: process.env.FIREBASE_CLIENT_EMAIL || "your-client-email",
            client_id: process.env.FIREBASE_CLIENT_ID || "your-client-id",
            auth_uri: "https://accounts.google.com/o/oauth2/auth",
            token_uri: "https://oauth2.googleapis.com/token",
            auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
            client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL || "your-client-email"}`,
          }
        }
      }
    });

    // Example 4: Using GOOGLE_APPLICATION_CREDENTIALS (No additional config needed)
    console.log("📝 Example 4: GOOGLE_APPLICATION_CREDENTIALS");
    const monitoredOpenAI4 = await monitor(openai, {
      database: {
        type: "firebase",
        firebase: {
          projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
          collection: "openai_logs",
          // No additional credentials needed - uses GOOGLE_APPLICATION_CREDENTIALS
        }
      }
    });

    console.log("✅ All Firebase configuration examples loaded successfully!");
    console.log("💡 Recommended approach: Use plug-and-play mode (Example 1) for seamless integration");
    console.log("🛡️  All configurations only operate on specified collections - zero interference!");

    // Test with the plug-and-play configuration
    const response = await (monitoredOpenAI1 as any).chat.completions.create(
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello from Firebase config example!" }],
      },
      undefined,
      {
        metadata: {
          userId: "config-test-user",
          sessionId: "config-test-session",
          feature: "firebase-config-test",
        },
      }
    );

    console.log("✅ Test API call successful:", response.choices[0]?.message);
    
  } catch (error) {
    console.error("❌ Firebase configuration test failed:", error);
  }
})();
