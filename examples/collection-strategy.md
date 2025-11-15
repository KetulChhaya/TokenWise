# Database Collection Strategy for TokenWise

## 🎯 **Recommended Approach: Unified Collections with Metadata**

### **Default Strategy: Same Collection**
Use the **same collection** for both regular OpenAI and LangChain calls, but distinguish them using **metadata**.

```typescript
// Regular OpenAI monitoring
const monitoredOpenAI = await monitor(openai, {
  database: { 
    type: "firebase", 
    firebase: { 
      projectId: "...", 
      collection: "llm_logs" // ← Same collection
    }
  },
  metadata: { 
    integration: "openai-direct",
    feature: "chat"
  }
});

// LangChain monitoring  
const monitoredModel = await monitorChatOpenAI(model, {
  database: { 
    type: "firebase", 
    firebase: { 
      projectId: "...", 
      collection: "llm_logs" // ← Same collection
    }
  },
  metadata: { 
    integration: "langchain", // ← Distinguish via metadata
    feature: "business-chat"
  }
});
```

## ✅ **Benefits of Unified Collections**

### **1. Centralized Analytics**
```sql
-- Query all LLM usage across integrations
SELECT * FROM llm_logs WHERE date >= '2024-01-01'

-- Compare costs by integration type
SELECT integration, SUM(cost) FROM llm_logs GROUP BY integration

-- Analyze usage patterns
SELECT feature, COUNT(*), AVG(cost) FROM llm_logs GROUP BY feature
```

### **2. Simplified Infrastructure**
- **Single database setup** - No need to manage multiple collections
- **Unified monitoring dashboards** - All metrics in one place
- **Easier cost tracking** - Total spend across all integrations

### **3. Flexible Querying**
```javascript
// Firebase: Filter by integration type
db.collection('llm_logs')
  .where('metadata.integration', '==', 'langchain')
  .get()

// MongoDB: Aggregate by integration
db.llm_logs.aggregate([
  { $group: { _id: "$metadata.integration", totalCost: { $sum: "$cost" } } }
])
```

## 🔧 **Alternative: Separate Collections (Optional)**

If you prefer separation, you can easily configure different collections:

```typescript
// Option A: Separate by integration type
const openaiMonitored = await monitor(openai, {
  database: { 
    firebase: { collection: "openai_logs" }
  }
});

const langchainMonitored = await monitorChatOpenAI(model, {
  database: { 
    firebase: { collection: "langchain_logs" }
  }
});

// Option B: Separate by application feature
const chatMonitored = await monitorChatOpenAI(model, {
  database: { 
    firebase: { collection: "chat_logs" }
  }
});

const analysisMonitored = await monitorChatOpenAI(model, {
  database: { 
    firebase: { collection: "analysis_logs" }
  }
});
```

## 📊 **Collection Naming Conventions**

### **Recommended Names:**
- `llm_logs` - General purpose, all integrations
- `openai_logs` - OpenAI-specific logs
- `langchain_logs` - LangChain-specific logs
- `chat_logs` - Chat/conversation features
- `analysis_logs` - Analysis/processing features

### **Metadata Conventions:**
```json
{
  "timestamp": "2024-01-15T10:30:45Z",
  "model": "gpt-4o-mini",
  "cost": 0.000234,
  "metadata": {
    "integration": "langchain|openai-direct",
    "feature": "chat|analysis|summarization",
    "userId": "user123",
    "sessionId": "session456",
    "application": "business-advisor|content-generator",
    "version": "1.2.0"
  }
}
```

## 🎯 **Best Practices**

### **1. Use Consistent Metadata**
Always include these metadata fields:
- `integration` - "langchain" or "openai-direct"
- `feature` - What functionality is being used
- `userId` - For user-based analytics
- `application` - Your app name/version

### **2. Environment-Based Collections**
```typescript
const collection = process.env.NODE_ENV === 'production' 
  ? 'llm_logs' 
  : 'llm_logs_dev';

const monitoredModel = await monitorChatOpenAI(model, {
  database: { firebase: { collection } }
});
```

### **3. Date-Based Collections (Advanced)**
```typescript
const collection = `llm_logs_${new Date().toISOString().slice(0, 7)}`; // llm_logs_2024-01

const monitoredModel = await monitorChatOpenAI(model, {
  database: { firebase: { collection } }
});
```

## 🚀 **Migration Strategy**

If you're already using separate collections and want to unify:

```typescript
// 1. Start logging to unified collection
const monitoredModel = await monitorChatOpenAI(model, {
  database: { firebase: { collection: "llm_logs" } },
  metadata: { integration: "langchain", migrated: true }
});

// 2. Migrate existing data (Firebase example)
const batch = db.batch();
const oldLogs = await db.collection('langchain_logs').get();
oldLogs.forEach(doc => {
  const data = { ...doc.data(), metadata: { ...doc.data().metadata, integration: "langchain" } };
  batch.set(db.collection('llm_logs').doc(), data);
});
await batch.commit();
```

## 📝 **Summary**

**Recommended**: Use **unified collections** with **metadata differentiation**
- ✅ Simpler infrastructure
- ✅ Better analytics capabilities  
- ✅ Easier cost tracking
- ✅ More flexible querying

**Alternative**: Use **separate collections** if you need strict separation
- ✅ Clear data boundaries
- ✅ Independent scaling
- ✅ Role-based access control
