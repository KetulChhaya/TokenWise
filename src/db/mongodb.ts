import type { LogRecord, MongoDBConfig } from "../types.js";

export interface MongoDBHandler {
  insertLog(log: LogRecord): void;
}

export function createMongoDBHandler(config: MongoDBConfig): MongoDBHandler {
  const collectionName = config.collection || "llm_logs"; // Default collection name
  console.log(`MongoDB database initialized for database: ${config.database}, collection: ${collectionName}`);
  
  // Initialize MongoDB client
  let MongoClient: any = null;
  let client: any = null;
  let db: any = null;
  let collection: any = null;
  
  try {
    // Dynamic import to avoid issues when MongoDB is not installed
    const initializeMongoDB = async () => {
      if (!MongoClient) {
        let mongodb: any;
        try {
          mongodb = await import("mongodb");
        } catch (error) {
          console.error("MongoDB is not installed!");
          console.log("To use MongoDB database, install MongoDB: npm install mongodb");
          throw new Error("MongoDB is required for MongoDB database support. Please install it: npm install mongodb");
        }
        MongoClient = mongodb.MongoClient;
        
        // Initialize MongoDB client with user-provided options or defaults
        client = new MongoClient(config.connectionUrl, config.options);
        
        // Connect to MongoDB
        await client.connect();
        db = client.db(config.database);
        collection = db.collection(collectionName);
        
        console.log("MongoDB client initialized successfully");
      }
    };
    
    // Initialize MongoDB (async but we'll handle it in insertLog)
    initializeMongoDB().catch(console.error);
    
    return {
      insertLog(log: LogRecord) {
        if (!client || !db || !collection) {
          console.warn("MongoDB client not initialized yet. Logs are being printed to console instead of being stored in MongoDB.");
          console.log("To fix this, ensure MongoDB is properly configured:");
          console.log("   1. Install MongoDB: npm install mongodb");
          console.log("   2. Provide a valid MongoDB connection URL");
          console.log("   3. Ensure your MongoDB Atlas cluster is accessible");
          console.log(`Current log (would be stored in ${config.database} collection: ${collectionName}):`);
          console.log(JSON.stringify(log, null, 2));
          return;
        }
        
        try {
          // Clean the log data to remove undefined values and prepare for MongoDB
          const cleanLog = {
            timestamp: log.timestamp,
            provider: log.provider,
            model: log.model,
            input_tokens: log.input_tokens ?? null,
            output_tokens: log.output_tokens ?? null,
            cost: log.cost ?? null,
            latency_ms: log.latency_ms,
            status: log.status,
            ...(log.error_message && { error_message: log.error_message }),
            metadata: log.metadata ?? null,
            createdAt: log.timestamp, // Store ISO format timestamp as createdAt
          };

          // Insert log into MongoDB collection
          collection.insertOne(cleanLog).then(() => {
            // Silent success - no need to log every successful insert
          }).catch((error: any) => {
            console.error("Failed to insert log to MongoDB:", error.message || error);
            // Don't throw here to avoid breaking the main application flow
          });
        } catch (error) {
          console.error("Error inserting log to MongoDB:", error);
        }
      }
    };
  } catch (error) {
    console.error("Failed to initialize MongoDB client:", error);
    
    // Fallback to console logging
    return {
      insertLog(log: LogRecord) {
        console.log(`MongoDB log (fallback): ${JSON.stringify(log)} to database: ${config.database}, collection: ${collectionName}`);
      }
    };
  }
}
