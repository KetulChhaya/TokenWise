# TokenWise Examples

This directory contains comprehensive examples demonstrating how to use TokenWise with different databases and configurations.

## 📁 Example Files

### **Basic Examples**
- **`sqlite-basic.ts`** - Basic SQLite monitoring with regular API calls
- **`firebase-basic.ts`** - Basic Firebase monitoring with regular API calls

### **Streaming Examples**
- **`sqlite-streaming.ts`** - SQLite monitoring with streaming API calls
- **`firebase-streaming.ts`** - Firebase monitoring with streaming API calls

### **Configuration Examples**
- **`firebase-config.ts`** - Multiple Firebase configuration methods
- **`firebase-env.ts`** - Environment variable setup and validation

### **LangChain Integration Examples**
- **`langchain-basic.ts`** - Basic LangChain ChatOpenAI monitoring
- **`langchain-streaming.ts`** - LangChain streaming with TokenWise monitoring

## 🚀 Quick Start

### SQLite (Default)
```bash
# Basic monitoring
npx tsx examples/sqlite-basic.ts

# Streaming monitoring
npx tsx examples/sqlite-streaming.ts
```

### Firebase
```bash
# Basic monitoring
npx tsx examples/firebase-basic.ts

# Streaming monitoring
npx tsx examples/firebase-streaming.ts

# Configuration examples
npx tsx examples/firebase-config.ts

# Environment setup
npx tsx examples/firebase-env.ts
```

### LangChain
```bash
# Basic LangChain monitoring
npx tsx examples/langchain-basic.ts

# LangChain streaming monitoring
npx tsx examples/langchain-streaming.ts
```

## 🔧 Environment Setup

Create a `.env` file in your project root:

```env
# Required for all examples
OPENAI_API_KEY=your_openai_api_key

# Required for Firebase examples
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
```

## 📊 What Each Example Demonstrates

### **Basic Examples**
- ✅ Simple API call monitoring
- ✅ Cost and token tracking
- ✅ Metadata support
- ✅ Database logging

### **Streaming Examples**
- ✅ Real-time streaming support
- ✅ Token accumulation during streaming
- ✅ Real-time cost calculation
- ✅ Streaming completion logging

### **Configuration Examples**
- ✅ Multiple Firebase authentication methods
- ✅ Environment variable validation
- ✅ Error handling and setup guidance

## 🎯 Key Features Demonstrated

- **Non-intrusive Monitoring** - Zero code changes required
- **Multiple Databases** - SQLite and Firebase support
- **Streaming Support** - Full streaming API coverage
- **Cost Tracking** - Real-time cost calculation
- **Metadata Support** - Custom tracking capabilities
- **Error Handling** - Graceful error management

## 📝 Usage Patterns

### Basic Monitoring
```typescript
const monitoredOpenAI = await monitor(openai);
const response = await monitoredOpenAI.chat.completions.create({...});
```

### Firebase Monitoring
```typescript
const monitoredOpenAI = await monitor(openai, {
  database: {
    type: "firebase",
    firebase: { projectId: "...", collection: "...", ... }
  }
});
```

### Streaming Monitoring
```typescript
const stream = await monitoredOpenAI.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [...],
  stream: true
});

for await (const chunk of stream) {
  console.log(chunk.choices[0]?.delta?.content);
}
```

## 🔍 Database Output

### SQLite
- Database file: `llm-logs.db`
- Table: `llm_logs`
- Columns: timestamp, provider, model, input_tokens, output_tokens, cost, latency_ms, status, metadata

### Firebase
- Collection: `openai_logs` (basic) or `streaming_logs` (streaming)
- Document fields: Same as SQLite columns
- Real-time updates and cloud storage

## 🛠️ Troubleshooting

### Common Issues
1. **Missing Environment Variables** - Check `.env` file setup
2. **Firebase Authentication** - Verify credentials and project ID
3. **Database Permissions** - Ensure write access to SQLite file or Firebase collection

### Getting Help
- Check console output for detailed error messages
- Verify environment variables are set correctly
- Ensure required dependencies are installed (`better-sqlite3` for SQLite, `firebase-admin` for Firebase)
