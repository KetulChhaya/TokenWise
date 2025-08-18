import Database from "better-sqlite3";
import path from "path";
import type { LogRecord } from "./types.js";

const getDB = () => {
  const dbPath = path.resolve(process.cwd(), "llm-logs.db");
  return new Database(dbPath, { readonly: true });
};

export const getLogs = (): LogRecord[] => {
  try {
    const db = getDB();
    const logs = db.prepare("SELECT * FROM llm_logs").all();
    return logs as LogRecord[];
  } catch (error: any) {
    if (error.code === "SQLITE_ERROR") {
      // This can happen if the DB doesn't exist yet, which is not an error.
      return [];
    }
    throw error;
  }
};

export const getCostSummary = (options?: {
  groupBy?: string;
}): Record<string, any> => {
  try {
    const db = getDB();
    if (!options?.groupBy) {
      const result = db
        .prepare("SELECT SUM(cost) as totalCost FROM llm_logs")
        .get();
      return result as Record<string, any>;
    }

    const key = options.groupBy;
    const query = `
      SELECT
        json_extract(metadata, '$.${key}') as grouped_by,
        SUM(cost) as total_cost
      FROM llm_logs
      WHERE json_extract(metadata, '$.${key}') IS NOT NULL
      GROUP BY grouped_by
    `;
    const results = db.prepare(query).all();

    return results.reduce((acc: Record<string, any>, row: any) => {
      acc[row.grouped_by] = row.total_cost;
      return acc;
    }, {});
  } catch (error: any) {
    if (error.code === "SQLITE_ERROR") {
      return {};
    }
    throw error;
  }
};
