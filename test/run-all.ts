import "dotenv/config";
import { spawn } from "child_process";
import path from "path";

async function runTest(testFile: string, testName: string) {
  return new Promise<void>((resolve, reject) => {
    console.log(`\n🚀 Running ${testName}...`);
    console.log("=" .repeat(60));
    
    const child = spawn("npx", ["tsx", testFile], {
      stdio: "inherit",
      cwd: process.cwd()
    });
    
    child.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ ${testName} completed successfully!`);
        resolve();
      } else {
        console.log(`❌ ${testName} failed with code ${code}`);
        reject(new Error(`${testName} failed`));
      }
    });
    
    child.on("error", (error) => {
      console.error(`❌ Error running ${testName}:`, error);
      reject(error);
    });
  });
}

async function runAllTests() {
  console.log("🧪 TokenWise Monitoring Test Suite");
  console.log("=" .repeat(60));
  
  // Check required environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY environment variable is required!");
    console.log("   Set it with: export OPENAI_API_KEY='your-api-key-here'");
    process.exit(1);
  }
  
  const tests = [
    {
      file: path.join(__dirname, "sqlite.test.ts"),
      name: "SQLite Monitoring Test"
    }
  ];
  
  // Add Firebase test if credentials are provided
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
    tests.push({
      file: path.join(__dirname, "firebase.test.ts"),
      name: "Firebase Monitoring Test"
    });
  } else {
    console.log("⚠️  Skipping Firebase test (credentials not provided)");
    console.log("   To test Firebase, set these environment variables:");
    console.log("   export FIREBASE_PROJECT_ID='your-project-id'");
    console.log("   export FIREBASE_CLIENT_EMAIL='your-client-email'");
    console.log("   export FIREBASE_PRIVATE_KEY='your-private-key'");
  }
  
  try {
    for (const test of tests) {
      await runTest(test.file, test.name);
    }
    
    console.log("\n🎉 All tests completed successfully!");
    console.log("📊 Check your databases for logged entries:");
    console.log("   • SQLite: llm-logs.db file");
    if (process.env.FIREBASE_PROJECT_ID) {
      console.log("   • Firebase: Firestore llm_logs collection");
    }
    
  } catch (error) {
    console.error("\n❌ Test suite failed:", error);
    process.exit(1);
  }
}

// Run all tests
runAllTests();
