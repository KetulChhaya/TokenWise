import Database from "better-sqlite3";
import path from "path";
import type { LogRecord } from "../types.js";

let db: Database.Database;

// Indempotent Function
export function initializeDatabase() {
    try {
        // Initialize the database
        const dbPath = path.resolve(process.cwd(), "llm-logs.db");
        db = new Database(dbPath);

        // WAL mode for better concurrency and performance.
        db.pragma("journal_mode = WAL");

        // Create the log table if it doesn't exist
        const createTableStatement = `
        CREATE TABLE IF NOT EXISTS llm_logs(
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
        console.log("Database initialized successfully");
    } catch (error) {
        console.error("Error initializing database:", error);
        throw error;
    }
}

// Inserts a log record into the database
export function insertLog(log: LogRecord) {
    try {
        const logToInsert = {
            ...log,
            metadata: log.metadata ? JSON.stringify(log.metadata) : null,
        };
        // Insert the log record into the database
        const insertStatement = db.prepare(`
        INSERT INTO llm_logs (timestamp, provider, model, input_tokens, output_tokens, cost, latency_ms, status, error_message, metadata) 
        VALUES (@timestamp, @provider, @model, @input_tokens, @output_tokens, @cost, @latency_ms, @status, @error_message, @metadata)
        `);
        insertStatement.run(logToInsert);
    } catch (error) {
        console.error("Error inserting log to database:", error);
        throw error;
    }
}
