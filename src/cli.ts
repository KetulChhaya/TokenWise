#!/usr/bin/env node

import { Command } from "commander";
import { Table } from "console-table-printer";
import Database from "better-sqlite3";
import path from "path";

const program = new Command();

program
  .name("tokenwise-tracker")
  .description("A CLI to analyze and monitor your LLM API costs.")
  .version("0.1.0");

program
  .command("dashboard")
  .description("Displays a dashboard with a summary of your LLM costs.")
  .option("-g, --group-by <key>", "Group the results by a metadata key.")
  .action((options) => {
    try {
      const dbPath = path.resolve(process.cwd(), "llm-logs.db");
      const db = new Database(dbPath, { readonly: true });

      const key = options.groupBy || options['group-by'];
      if (key) {
        const query = `
          SELECT
            json_extract(metadata, '$.${key}') as grouped_by,
            COUNT(*) as total_calls,
            SUM(cost) as total_cost,
            AVG(latency_ms) as avg_latency
          FROM llm_logs
          WHERE json_extract(metadata, '$.${key}') IS NOT NULL
          GROUP BY grouped_by
        `;
        const results = db.prepare(query).all();

        if (results.length === 0) {
          console.log("No logs found with that metadata key.");
          return;
        }

        const table = new Table({
          title: `Cost Dashboard Grouped by ${key}`,
          columns: [
            { name: "grouped_by", alignment: "left" },
            { name: "total_calls", alignment: "right" },
            { name: "total_cost", alignment: "right" },
            { name: "avg_latency", alignment: "right" },
          ],
        });

        for (const row of results as any[]) {
          table.addRow({
            grouped_by: row.grouped_by,
            total_calls: row.total_calls,
            total_cost: row.total_cost
              ? `$${row.total_cost.toFixed(6)}`
              : "N/A",
            avg_latency: `${row.avg_latency.toFixed(0)}ms`,
          });
        }
        table.printTable();
        return;
      }

      // Default log view
      const logs = db.prepare("SELECT * FROM llm_logs").all();

      if (logs.length === 0) {
        console.log("No logs found.");
        return;
      }

      const table = new Table({
        title: "LLM Cost Dashboard",
        columns: [
          { name: "timestamp", alignment: "left" },
          { name: "model", alignment: "left" },
          { name: "provider", alignment: "left" },
          { name: "cost", alignment: "right" },
          { name: "latency_ms", alignment: "right" },
          { name: "status", alignment: "left" },
        ],
      });

      let totalCost = 0;
      for (const log of logs as any[]) {
        table.addRow(
          {
            timestamp: new Date(log.timestamp).toLocaleString(),
            model: log.model,
            provider: log.provider,
            cost: log.cost ? `$${log.cost.toFixed(6)}` : "N/A",
            latency_ms: log.latency_ms,
            status: log.status,
          },
          { color: log.status === "ERROR" ? "red" : "green" }
        );
        totalCost += log.cost || 0;
      }

      table.printTable();
      console.log(`\nTotal Cost: $${totalCost.toFixed(6)}`);
    } catch (error: any) {
      if (error.code === "SQLITE_ERROR") {
        console.error(
          "Error: Could not find the database. Make sure you have run your monitored application to generate logs."
        );
      } else {
        console.error("An unexpected error occurred:", error.message);
      }
    }
  });

program.parse(process.argv);
