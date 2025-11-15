import path from "path";
import type { LogRecord, SQLiteConfig } from "../types.js";

export interface SQLiteHandler {
  insertLog(log: LogRecord): void;
}

export async function createSQLiteHandler(config?: SQLiteConfig): Promise<SQLiteHandler> {
  // Check if better-sqlite3 is installed
  let Database: any;
  try {
    // Use dynamic import with .then() to avoid async/await in non-async function
    const betterSqlite3 = await import("better-sqlite3");
    Database = betterSqlite3.default;
  } catch (error) {
    console.error("better-sqlite3 is not installed!");
    console.log("To use SQLite database, install better-sqlite3: npm install better-sqlite3");
    throw new Error("better-sqlite3 is required for SQLite database support. Please install it: npm install better-sqlite3");
  }

  // Use configurable filename and table name with defaults
  const filename = config?.filename || "llm-logs.db";
  const tableName = config?.tableName || "llm_logs";
  
  // Initialize the database
  const dbPath = path.resolve(process.cwd(), filename);
  const db = new Database(dbPath);

  // WAL mode for better concurrency and performance.
  db.pragma("journal_mode = WAL");

  // Create the log table if it doesn't exist
  const createTableStatement = `
      CREATE TABLE IF NOT EXISTS ${tableName}(
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp TEXT NOT NULL,
          provider TEXT NOT NULL,
          model TEXT NOT NULL,
          input_tokens INTEGER,
          output_tokens INTEGER,
          cost REAL,
          latency_ms INTEGER NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'ERROR')),
          error_message TEXT,
          metadata TEXT
      )
  `;
  db.exec(createTableStatement);
  console.log("SQLite database initialized successfully");

  return {
    insertLog(log: LogRecord) {
      try {
        const logToInsert = {
          ...log,
          input_tokens: log.input_tokens ?? null,
          output_tokens: log.output_tokens ?? null,
          cost: log.cost ?? null,
          error_message: log.error_message ?? null,
          metadata: log.metadata ? JSON.stringify(log.metadata) : null,
        };
        // Insert the log record into the database
        const insertStatement = db.prepare(`
        INSERT INTO ${tableName} (timestamp, provider, model, input_tokens, output_tokens, cost, latency_ms, status, error_message, metadata) 
        VALUES (@timestamp, @provider, @model, @input_tokens, @output_tokens, @cost, @latency_ms, @status, @error_message, @metadata)
        `);
        insertStatement.run(logToInsert);
      } catch (error) {
        console.error("Error inserting log to SQLite database:", error);
        throw error;
      }
    }
  };
}
