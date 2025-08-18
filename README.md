# TokenWise

A lightweight, zero-dependency NPM package to monitor the costs of OpenAI API calls. Get clear insights into your LLM expenses with minimal setup.

## Features

-   **Cost Tracking**: Automatically logs the cost, token usage, and latency of each OpenAI API call.
-   **Robust Logging**: Stores all monitoring data locally in a SQLite database (`llm-logs.db`).
-   **Error Handling**: Captures and logs failed API calls so you can debug issues.
-   **Intelligent Model Matching**: Automatically detects base models (e.g., `gpt-4` from `gpt-4-0125-preview`) for accurate pricing.
-   **TypeScript Support**: Fully written in TypeScript with type definitions included.

## Installation

```bash
npm install tokenwise
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
import { monitor, initializeDatabase } from "tokenwise";
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

## Programmatic API

TokenWise also provides functions to access the logged data programmatically, allowing you to build custom reports, dashboards, or alerting systems.

### `getLogs(): LogRecord[]`

Fetches all log records from the database.

```typescript
import { getLogs } from "tokenwise";

const allLogs = getLogs();
console.log(`Found ${allLogs.length} logs.`);
```

### `getCostSummary(options): object`

Fetches aggregated cost data.

**Options:**
-   `groupBy?: string`: A metadata key to group the cost summary by.

**Examples:**

```typescript
import { getCostSummary } from "tokenwise";

// Get the total cost of all calls
const { totalCost } = getCostSummary();
console.log(`Total cost: $${totalCost.toFixed(6)}`);

// Get the total cost grouped by user
const costByUser = getCostSummary({ groupBy: "userId" });
// { 'user-123': 0.00015, 'user-456': 0.00028 }
console.log("Cost by user:", costByUser);
```

## CLI Dashboard

TokenWise comes with a built-in command-line dashboard to quickly analyze your collected data directly from the terminal.

### Basic Usage

To see a list of all your recent API calls, run:

```bash
npx tokenwise dashboard
```

This will display a table with the timestamp, model, cost, latency, and status of each call.

### Grouped Analysis

The most powerful feature of the dashboard is the ability to group your data using the metadata you've logged. To see a summary of costs grouped by any metadata key (e.g., `userId`), use the `--group-by` flag:

```bash
npx tokenwise dashboard --group-by userId
```

This will output a summary table showing the total calls, total cost, and average latency for each user.

## How It Works

This package uses a JavaScript `Proxy` to non-intrusively wrap your OpenAI client. It intercepts calls to `chat.completions.create`, records the start and end times, calculates the cost based on the model and token usage, and logs the results (including any custom metadata) to the database. It's designed to have zero impact on your existing code's logic.

## Contributing

This is an open-source project, and contributions are welcome! Please feel free to open an issue or submit a pull request.
