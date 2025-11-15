# Collection Configuration Guide

## 🎯 **Overview**

TokenWise now supports **configurable collection/table names** across all database types with **smart defaults**. This allows you to:

- ✅ **Separate logs by integration type** (OpenAI vs LangChain)
- ✅ **Organize by application feature** (chat, analysis, etc.)
- ✅ **Environment-based separation** (dev, staging, prod)
- ✅ **Custom naming conventions** for your organization

## 📊 **Default Behavior**

**All databases use `"llm_logs"` as the default collection/table name:**

```typescript
// These are equivalent - both use default "llm_logs"
const monitored1 = await monitor(openai);
const monitored2 = await monitor(openai, { database: { type: "sqlite" } });
const monitored3 = await monitorChatOpenAI(model, { database: { type: "firebase", firebase: { projectId: "..." } } });
```

## 🗂️ **Configuration Options**

### **SQLite Configuration**

```typescript
const monitored = await monitor(openai, {
  database: {
    type: "sqlite",
    sqlite: {
      filename: "my-app-logs.db",    // Optional: defaults to "llm-logs.db"
      tableName: "openai_usage"      // Optional: defaults to "llm_logs"
    }
  }
});
```

### **Firebase Configuration**

```typescript
const monitored = await monitor(openai, {
  database: {
    type: "firebase",
    firebase: {
      projectId: "your-project-id",
      collection: "openai_logs",     // Optional: defaults to "llm_logs"
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
    }
  }
});
```

### **MongoDB Configuration**

```typescript
const monitored = await monitor(openai, {
  database: {
    type: "mongodb",
    mongodb: {
      connectionUrl: "mongodb://...",
      database: "tokenwise",
      collection: "api_usage"        // Optional: defaults to "llm_logs"
    }
  }
});
```

## 🎨 **Common Patterns**

### **1. Separation by Integration Type**

```typescript
// OpenAI Direct API calls
const openaiMonitored = await monitor(openai, {
  database: { 
    type: "firebase", 
    firebase: { 
      projectId: "...", 
      collection: "openai_direct_logs" 
    } 
  },
  metadata: { integration: "openai-direct" }
});

// LangChain calls
const langchainMonitored = await monitorChatOpenAI(model, {
  database: { 
    type: "firebase", 
    firebase: { 
      projectId: "...", 
      collection: "langchain_logs" 
    } 
  },
  metadata: { integration: "langchain" }
});
```

### **2. Unified Collection with Metadata (Recommended)**

```typescript
// Both use same collection, differentiated by metadata
const openaiMonitored = await monitor(openai, {
  database: { type: "firebase", firebase: { projectId: "..." } }, // Uses default "llm_logs"
  metadata: { integration: "openai-direct", feature: "chat" }
});

const langchainMonitored = await monitorChatOpenAI(model, {
  database: { type: "firebase", firebase: { projectId: "..." } }, // Uses default "llm_logs"
  metadata: { integration: "langchain", feature: "business-advisor" }
});
```

### **3. Environment-Based Collections**

```typescript
const env = process.env.NODE_ENV || 'development';
const monitored = await monitor(openai, {
  database: {
    type: "firebase",
    firebase: {
      projectId: "...",
      collection: `llm_logs_${env}` // "llm_logs_production", "llm_logs_development"
    }
  }
});
```

### **4. Feature-Based Collections**

```typescript
// Chat feature
const chatMonitored = await monitorChatOpenAI(model, {
  database: { 
    type: "mongodb", 
    mongodb: { 
      connectionUrl: "...", 
      database: "myapp", 
      collection: "chat_logs" 
    } 
  }
});

// Analysis feature
const analysisMonitored = await monitorChatOpenAI(model, {
  database: { 
    type: "mongodb", 
    mongodb: { 
      connectionUrl: "...", 
      database: "myapp", 
      collection: "analysis_logs" 
    } 
  }
});
```

### **5. Date-Based Collections (Advanced)**

```typescript
const currentMonth = new Date().toISOString().slice(0, 7); // "2024-01"
const monitored = await monitor(openai, {
  database: {
    type: "firebase",
    firebase: {
      projectId: "...",
      collection: `llm_logs_${currentMonth}` // "llm_logs_2024-01"
    }
  }
});
```

## 📝 **Collection Naming Conventions**

### **Recommended Names:**

| Purpose | Collection Name | Example |
|---------|----------------|---------|
| **General** | `llm_logs` | Default for all usage |
| **By Integration** | `openai_logs`, `langchain_logs` | Separate by integration type |
| **By Feature** | `chat_logs`, `analysis_logs` | Separate by app feature |
| **By Environment** | `llm_logs_prod`, `llm_logs_dev` | Separate by environment |
| **By Date** | `llm_logs_2024_01` | Monthly/yearly separation |

### **Metadata Conventions:**
```json
{
  "timestamp": "2024-01-15T10:30:45Z",
  "model": "gpt-4o-mini",
  "cost": 0.000234,
  "metadata": {
    "integration": "langchain|openai-direct",
    "feature": "chat|analysis|summarization",
    "environment": "production|development|staging",
    "userId": "user123",
    "application": "business-advisor|content-generator"
  }
}
```

## 🔍 **Querying Different Collections**

### **Firebase Firestore**
```javascript
// Query specific collection
db.collection('langchain_logs').where('cost', '>', 0.001).get()

// Query across multiple collections (requires separate queries)
const [openaiLogs, langchainLogs] = await Promise.all([
  db.collection('openai_logs').get(),
  db.collection('langchain_logs').get()
]);
```

### **MongoDB**
```javascript
// Query specific collection
db.langchain_logs.find({ cost: { $gt: 0.001 } })

// Aggregate across collections (advanced)
db.runCommand({
  aggregate: 1,
  pipeline: [
    { $unionWith: { coll: "openai_logs" } },
    { $unionWith: { coll: "langchain_logs" } },
    { $group: { _id: "$metadata.integration", totalCost: { $sum: "$cost" } } }
  ]
})
```

### **SQLite**
```sql
-- Query specific table
SELECT * FROM langchain_usage WHERE cost > 0.001;

-- Query across tables (requires UNION)
SELECT 'openai' as source, * FROM openai_usage
UNION ALL
SELECT 'langchain' as source, * FROM langchain_usage;
```

## 🚀 **Migration Examples**

### **From Single to Multiple Collections**
```typescript
// Step 1: Start logging to new collections
const newMonitored = await monitor(openai, {
  database: { firebase: { collection: "openai_v2_logs" } }
});

// Step 2: Migrate existing data (Firebase example)
const oldLogs = await db.collection('llm_logs').get();
const batch = db.batch();
oldLogs.forEach(doc => {
  const data = doc.data();
  if (data.metadata?.integration === 'openai-direct') {
    batch.set(db.collection('openai_v2_logs').doc(), data);
  }
});
await batch.commit();
```

### **From Multiple to Unified Collections**
```typescript
// Migrate to unified collection with enhanced metadata
const unifiedMonitored = await monitor(openai, {
  database: { firebase: { collection: "llm_logs_unified" } },
  metadata: { 
    integration: "openai-direct",
    migrationSource: "openai_logs",
    version: "2.0"
  }
});
```

## 📊 **Best Practices**

1. **Start Simple**: Use default `"llm_logs"` with metadata differentiation
2. **Scale Gradually**: Add separate collections only when needed
3. **Consistent Naming**: Use clear, predictable naming conventions
4. **Environment Separation**: Always separate prod/dev data
5. **Metadata Rich**: Include comprehensive metadata for filtering
6. **Monitor Growth**: Consider date-based collections for high-volume apps

## 🧪 **Testing Your Configuration**

Run the collection configuration example:
```bash
npx tsx examples/collection-configuration.ts
```

This will test all configuration options and show you exactly where your logs are being stored!
