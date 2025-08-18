export interface LogRecord {
  timestamp: string;
  provider: string;
  model: string;
  input_tokens?: number | undefined;
  output_tokens?: number | undefined;
  cost?: number | undefined;
  latency_ms: number;
  status: "SUCCESS" | "ERROR";
  error_message?: string | null;
  metadata?: Record<string, any>;
}
