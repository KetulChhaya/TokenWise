# TokenWise Tracker

[![npm version](https://badge.fury.io/js/tokenwise-tracker.svg)](https://badge.fury.io/js/tokenwise-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-16%2B-green.svg)](https://nodejs.org/)
[![Downloads](https://img.shields.io/npm/dm/tokenwise-tracker.svg)](https://www.npmjs.com/package/tokenwise-tracker)

A lightweight, zero-dependency NPM package to monitor OpenAI API costs, token usage, and performance. Get clear insights into your LLM expenses with minimal setup.

## Table of Contents

- [Features](#features)
- [Supported Models](#supported-models)
- [Installation](#installation)
- [Quick Start](#quick-start)
  - [Set Up Your Environment](#1-set-up-your-environment)
  - [Wrap Your OpenAI Client](#2-wrap-your-openai-client)
  - [Examples](#3-examples)
- [How It Works](#how-it-works)
- [Advanced Features](#advanced-features)
  - [Database Configuration](#database-configuration)
  - [Metadata Tracking](#metadata-tracking)
  - [MongoDB Atlas Setup](#mongodb-atlas-setup)
- [Contributing](#contributing)
- [License](#license)

## Features

-   **Cost Tracking**: Automatically logs the cost, token usage, and latency of each OpenAI API call
-   **Multiple Databases**: Support for SQLite (default), Firebase/Firestore, and MongoDB Atlas
-   **Metadata Support**: Attach custom metadata to track usage by user, feature, or session
-   **Zero Dependencies**: Only requires peer dependencies for your chosen database
-   **Non-Intrusive**: Uses JavaScript Proxy - no changes to your existing code
-   **TypeScript Support**: Full TypeScript definitions included



## Supported Models

TokenWise Tracker is designed to work with versioned and fine-tuned models by automatically matching them to a base model for pricing. The following base models are currently supported:

-   `gpt-5`
-   `gpt-5-mini`
-   `gpt-5-nano`
-   `gpt-4.1`
-   `gpt-4.1-mini`
-   `gpt-4.1-nano`
-   `gpt-4o`
-   `gpt-4o-mini`
-   `gpt-4.5`
-   `o1-pro`
-   `gpt-4` (Legacy)
-   `gpt-3.5-turbo` (Legacy)

For the most up-to-date pricing, please refer to the official OpenAI API documentation.

## Installation

### For SQLite
```bash
npm install tokenwise-tracker better-sqlite3
```

### For Firebase
```bash
npm install tokenwise-tracker firebase-admin
```

### For MongoDB
```bash
npm install tokenwise-tracker mongodb
```

### For All Databases
```bash
npm install tokenwise-tracker better-sqlite3 firebase-admin mongodb
```

### Using Yarn
```bash
# For SQLite
yarn add tokenwise-tracker better-sqlite3

# For Firebase
yarn add tokenwise-tracker firebase-admin

# For MongoDB
yarn add tokenwise-tracker mongodb
```

### Using pnpm
```bash
# For SQLite
pnpm add tokenwise-tracker better-sqlite3

# For Firebase
pnpm add tokenwise-tracker firebase-admin

# For MongoDB
pnpm add tokenwise-tracker mongodb
```

## Quick Start

Getting started with TokenWise Tracker is as simple as wrapping your OpenAI client.

### 1. Set Up Your Environment

First, make sure you have your OpenAI API key available in an environment variable. Create a `.env` file in the root of your project:

```bash
# Required for all databases
OPENAI_API_KEY=your_openai_api_key_here

# For MongoDB (if using MongoDB)
MONGODB_CONNECTION_URL=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/
MONGODB_DATABASE=tokenwise

# For Firebase (if using Firebase)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

### 2. Wrap Your OpenAI Client

In your application code, simply import the `monitor` function and wrap your existing OpenAI client. The database will be initialized automatically on the first run.

**Note**: Make sure to validate your environment variables are set before using them. The library will throw helpful error messages if required configuration is missing.

```typescript
import OpenAI from "openai";
import { monitor } from "tokenwise-tracker/dist/index.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create your standard OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Wrap the client with the monitor. That's it!
// The database is automatically initialized on the first call.
const monitoredOpenAI = await monitor(openai);

// For Firebase, specify the database type:
const monitoredOpenAI = await monitor(openai, {
  database: {
    type: "firebase",
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      collection: "llm_logs",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
    }
  }
});

// For MongoDB Atlas, specify the database type:
const monitoredOpenAI = await monitor(openai, {
  database: {
    type: "mongodb",
    mongodb: {
      connectionUrl: process.env.MONGODB_CONNECTION_URL,
      database: "tokenwise",
      collection: "llm_logs"
    }
  }
});

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

That's it! Every call you make using the `monitoredOpenAI` client will now be logged to the appropriate database.

### 3. Examples

The repository includes comprehensive examples for all supported databases:

- **SQLite**: `examples/sqlite-basic.ts` and `examples/sqlite-streaming.ts`
- **MongoDB**: `examples/mongodb-basic.ts`, `examples/mongodb-config.ts`, and `examples/mongodb-streaming.ts`  
- **Firebase**: `examples/firebase-basic.ts`, `examples/firebase-config.ts`, and `examples/firebase-streaming.ts`

Each example demonstrates different configuration options and use cases.

## How It Works

This package uses a JavaScript `Proxy` to non-intrusively wrap your OpenAI client. It intercepts calls to `chat.completions.create`, records the start and end times, calculates the cost based on the model and token usage, and logs the results (including any custom metadata) to the database. It's designed to have zero impact on your existing code's logic.

## LangChain Integration

TokenWise Tracker seamlessly integrates with LangChain's ChatOpenAI for automatic cost and token tracking in your LangChain applications.

### Installation for LangChain

```bash
# Install TokenWise with LangChain dependencies
npm install tokenwise-tracker @langchain/openai @langchain/core

# Choose your database (SQLite example)
npm install better-sqlite3
```

### Basic LangChain Usage

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { monitorChatOpenAI } from "tokenwise-tracker";

// 1. Create your regular ChatOpenAI model
const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4o-mini",
  temperature: 0.7,
});

// 2. Wrap it with TokenWise monitoring
const monitoredModel = await monitorChatOpenAI(model, {
  database: { type: "sqlite" },
  metadata: { userId: "user123", feature: "chat" }
});

// 3. Use exactly like regular ChatOpenAI - monitoring is automatic!
const response = await monitoredModel.invoke("Hello, world!");
const stream = await monitoredModel.stream("Count from 1 to 5");
```

### LangChain Streaming Example

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { monitorChatOpenAI } from "tokenwise-tracker";

// Create and monitor your ChatOpenAI model
const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4o-mini",
  streaming: true,
});

const monitoredModel = await monitorChatOpenAI(model, {
  database: { type: "sqlite" }, // or firebase/mongodb
  metadata: {
    userId: "user123",
    feature: "chat",
    integration: "langchain"
  }
});

// Use in your existing LangChain chains
const prompt = ChatPromptTemplate.fromTemplate("Write a story about: {topic}");
const chain = prompt.pipe(monitoredModel).pipe(new StringOutputParser());

// Stream the response - automatic monitoring!
const stream = await chain.stream({ topic: "AI robots" });
for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### What Gets Tracked

✅ **Input tokens** (from prompts and chat history)  
✅ **Output tokens** (from responses, including streaming)  
✅ **Cost calculation** (based on model pricing)  
✅ **Latency** (request start to completion)  
✅ **Success/error status**  
✅ **Custom metadata** (userId, sessionId, feature, etc.)  

All automatically logged to your chosen database with **zero code changes** to your existing LangChain logic!

## Advanced Features

### Database Configuration

```typescript
// SQLite (default)
const monitoredOpenAI = await monitor(openai);

// Firebase
const monitoredOpenAI = await monitor(openai, {
  database: {
    type: "firebase",
    firebase: {
      projectId: "your-project-id",
      collection: "llm_logs",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
    }
  }
});

// MongoDB Atlas
const monitoredOpenAI = await monitor(openai, {
  database: {
    type: "mongodb",
    mongodb: {
      connectionUrl: process.env.MONGODB_CONNECTION_URL,
      database: "tokenwise",
      collection: "llm_logs"
      // options: { maxPoolSize: 10 } // Optional: custom connection options
    }
  }
});
```

### Metadata Tracking

```typescript
const response = await (monitoredOpenAI as any).chat.completions.create(
  {
    model: "gpt-4",
    messages: [{ role: "user", content: "Hello" }]
  },
  undefined,
  {
    metadata: {
      userId: "user-123",
      feature: "chat",
      environment: "production"
    }
  }
);
```

### MongoDB Atlas Setup

To use MongoDB Atlas with TokenWise Tracker:

1. **Create a MongoDB Atlas Account**: Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas)

2. **Create a Cluster**: Set up a free or paid cluster in your preferred region

3. **Get Connection String**: 
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

4. **Set Environment Variables**:
   ```bash
   MONGODB_CONNECTION_URL=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/
   MONGODB_DATABASE=tokenwise
   ```

5. **Configure Network Access**: Add your IP address to the IP Access List in Atlas

6. **Use in Your Application**:
   ```typescript
   const monitoredOpenAI = await monitor(openai, {
     database: {
       type: "mongodb",
       mongodb: {
         connectionUrl: process.env.MONGODB_CONNECTION_URL,
         database: process.env.MONGODB_DATABASE,
         collection: "llm_logs"
       }
     }
   });
   ```

The MongoDB handler will automatically create the database and collection if they don't exist.


## Contributing

We welcome contributions from the community! Whether it's bug reports, feature requests, or code contributions, your help makes TokenWise better for everyone.

### Ways to Contribute

- **Report Bugs**: Open an issue with a clear description and reproduction steps
- **Request Features**: Suggest new features or improvements
- **Submit Code**: Fork the repository and submit a pull request
- **Improve Documentation**: Help us make the docs clearer and more comprehensive

### Development Setup

```bash
git clone https://github.com/KetulChhaya/TokenWise.git
cd TokenWise
npm install
npm run build
npm test
```

### Running Examples

```bash
# Set up your environment variables
cp .env.example .env
# Edit .env with your API keys

# Run examples
npm run build
node dist/examples/sqlite-basic.js
node dist/examples/mongodb-basic.js
node dist/examples/firebase-basic.js
```

### Code Style

- Use TypeScript for all new code
- Follow the existing code style and patterns
- Add tests for new features
- Update documentation as needed

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [OpenAI](https://openai.com/) for providing the amazing API
- The open-source community for inspiration and feedback
- All contributors who help make this project better
