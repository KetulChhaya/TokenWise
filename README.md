# LLM Cost Monitor

A lightweight, zero-dependency NPM package to monitor the costs of OpenAI API calls. Get clear insights into your LLM expenses with minimal setup.

## Features

-   **Cost Tracking**: Automatically logs the cost, token usage, and latency of each OpenAI API call.
-   **Robust Logging**: Stores all monitoring data locally in a SQLite database (`llm-logs.db`).
-   **Error Handling**: Captures and logs failed API calls so you can debug issues.
-   **Intelligent Model Matching**: Automatically detects base models (e.g., `gpt-4` from `gpt-4-0125-preview`) for accurate pricing.
-   **TypeScript Support**: Fully written in TypeScript with type definitions included.

## Installation

```bash
npm install llm-cost-monitor
```

## Quick Start

Monitoring your OpenAI costs is a simple, two-step process.

### 1. Set Up Your Environment

First, make sure you have your OpenAI API key available in an environment variable. Create a `.env` file in the root of your project:

```
OPENAI_API_KEY=<your_openai_api_key>
```

Our library uses `dotenv` to load this key automatically.

### 2. Wrap Your OpenAI Client

In your application code, import the `monitor` and `initializeDatabase` functions. Call `initializeDatabase` once when your application starts, and then wrap your existing OpenAI client with the `monitor` function.

```typescript
import OpenAI from "openai";
import { monitor, initializeDatabase } from "llm-cost-monitor";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize the database (creates llm-logs.db if it doesn't exist)
initializeDatabase();

// Create your standard OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Wrap the client with the monitor
const monitoredOpenAI = monitor(openai);

// Now, use the monitored client exactly as you would the original
async function main() {
  try {
    const response = await (monitoredOpenAI as any).chat.completions.create(
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello world" }],
      },
      undefined, // No options needed here
      // Pass custom metadata to be stored with the log
      {
        metadata: {
          userId: "user-123",
          sessionId: "session-abc",
          feature: "greeting-bot",
        },
      }
    );
    console.log("API call successful:", response.choices[0]?.message);
  } catch (error) {
    console.error("API call failed:", error);
  }
}

main();
```

That's it! Every call you make using the `monitoredOpenAI` client will now be logged to the `llm-logs.db` file in your project root.

## Viewing the Data

The collected data is stored in a standard SQLite database. You can view it using any SQLite browser, such as [DB Browser for SQLite](https://sqlitebrowser.org/).

*(Coming Soon: A built-in CLI dashboard to view analytics directly from your terminal!)*

## How It Works

This package uses a JavaScript `Proxy` to non-intrusively wrap your OpenAI client. It intercepts calls to `chat.completions.create`, records the start and end times, calculates the cost based on the model and token usage, and logs the results (including any custom metadata) to the database. It's designed to have zero impact on your existing code's logic.

## Contributing

This is an open-source project, and contributions are welcome! Please feel free to open an issue or submit a pull request.
