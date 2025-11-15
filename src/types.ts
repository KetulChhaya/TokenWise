export interface LogRecord {
  timestamp: string;
  provider: string;
  model: string;
  input_tokens?: number | undefined;
  output_tokens?: number | undefined;
  cost?: number | undefined;
  latency_ms: number;
  status: "SUCCESS" | "ERROR";
  error_message?: string;
  metadata?: Record<string, any>;
}

export type DatabaseType = "sqlite" | "firebase" | "mongodb";

export interface FirebaseConfig {
  projectId: string;
  collection?: string; // Optional, defaults to "llm_logs"
  // Firebase Admin SDK configuration options
  serviceAccountKey?: string; // Path to service account key file
  serviceAccount?: {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    client_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_x509_cert_url: string;
  };
  // Environment variables approach (recommended)
  clientEmail?: string;
  privateKey?: string;
}

export interface MongoDBConfig {
  connectionUrl: string;
  database: string;
  collection?: string; // Optional, defaults to "llm_logs"
  // Optional MongoDB connection options
  options?: {
    maxPoolSize?: number;
    minPoolSize?: number;
    maxIdleTimeMS?: number;
    serverSelectionTimeoutMS?: number;
    socketTimeoutMS?: number;
    connectTimeoutMS?: number;
  };
}

export interface SQLiteConfig {
  filename?: string; // Optional, defaults to "llm-logs.db"
  tableName?: string; // Optional, defaults to "llm_logs"
}

export interface DatabaseConfig {
  type: DatabaseType;
  firebase?: FirebaseConfig;
  mongodb?: MongoDBConfig;
  sqlite?: SQLiteConfig;
}

export interface MonitorOptions {
  database?: DatabaseConfig;
  metadata?: Record<string, any>;
}

// LangChain-specific types
export interface LangChainMonitorOptions extends MonitorOptions {
  // Additional LangChain-specific options can be added here in the future
}
