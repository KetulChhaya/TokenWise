import { Stream } from "openai/streaming";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";
import { calculateCost } from "./pricing.js";
import type { LogRecord } from "../types.js";

export interface StreamWrapperOptions {
  model: string;
  startTime: number;
  messages: any[]; // Add messages to estimate input tokens
  metadata?: Record<string, any> | undefined;
  onToken?: (token: string, runningCost: number) => void;
  onComplete?: (log: LogRecord) => void;
}

export class StreamWrapper {
  private originalStream: Stream<ChatCompletionChunk>;
  private options: StreamWrapperOptions;
  private accumulatedTokens = {
    input: 0,
    output: 0
  };
  private accumulatedCost = 0;
  private isComplete = false;
  private accumulatedContent = "";

  constructor(stream: Stream<ChatCompletionChunk>, options: StreamWrapperOptions) {
    this.originalStream = stream;
    this.options = options;
    
    // Estimate input tokens from messages
    this.accumulatedTokens.input = this.estimateInputTokens(options.messages);
  }

  private estimateInputTokens(messages: any[]): number {
    if (!messages || messages.length === 0) return 0;
    
    // Simple token estimation: ~4 characters per token for English text
    // This is a rough approximation - in production you might want to use tiktoken
    const totalText = messages
      .map(msg => typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content))
      .join(' ');
    
    return Math.ceil(totalText.length / 4);
  }

  // Make the wrapper async iterable
  async *[Symbol.asyncIterator]() {
    for await (const chunk of this.originalStream) {
      // Track tokens from each chunk
      this.trackChunk(chunk);
      
      // Yield the chunk to the user
      yield chunk;
    }
    
    // Stream is complete, log the final result
    this.logFinalResult();
  }

  private trackChunk(chunk: ChatCompletionChunk) {
    // For streaming, usage information is typically only available in the final chunk
    if (chunk.usage) {
      this.accumulatedTokens.input = chunk.usage.prompt_tokens || 0;
      this.accumulatedTokens.output = chunk.usage.completion_tokens || 0;
    }

    // Accumulate content for token estimation
    const tokenContent = chunk.choices[0]?.delta?.content;
    if (tokenContent) {
      this.accumulatedContent += tokenContent;
      
      // Estimate tokens based on content length (rough approximation)
      // This is a simple heuristic - in production you might want to use a proper tokenizer
      const estimatedTokens = Math.ceil(this.accumulatedContent.length / 4);
      
      // Calculate running cost based on estimated tokens
      const chunkCost = calculateCost(
        this.options.model,
        this.accumulatedTokens.input || 0, // Use actual input tokens if available
        estimatedTokens // Use estimated output tokens
      );

      if (chunkCost !== null) {
        this.accumulatedCost = chunkCost;
      }

      // Call the onToken callback
      if (this.options.onToken) {
        this.options.onToken(tokenContent, this.accumulatedCost);
      }
    }
  }

  private logFinalResult() {
    if (this.isComplete) return;
    this.isComplete = true;

    const latency = Date.now() - this.options.startTime;
    
    // Use actual tokens if available, otherwise use estimates
    const finalInputTokens = this.accumulatedTokens.input || 0;
    const finalOutputTokens = this.accumulatedTokens.output || Math.ceil(this.accumulatedContent.length / 4);
    
    // Recalculate final cost with actual token counts
    const finalCost = calculateCost(
      this.options.model,
      finalInputTokens,
      finalOutputTokens
    );
    
    const log: LogRecord = {
      timestamp: new Date().toISOString(),
      provider: "openai",
      model: this.options.model,
      input_tokens: finalInputTokens,
      output_tokens: finalOutputTokens,
      cost: finalCost || this.accumulatedCost,
      latency_ms: latency,
      status: "SUCCESS",
      ...(this.options.metadata && { metadata: this.options.metadata }),
    };

    // Call the completion callback if provided
    if (this.options.onComplete) {
      this.options.onComplete(log);
    }
  }

  // Delegate all other methods to the original stream
  get controller() {
    return this.originalStream.controller;
  }

  get [Symbol.toStringTag]() {
    return 'StreamWrapper';
  }

  tee(): [Stream<ChatCompletionChunk>, Stream<ChatCompletionChunk>] {
    return this.originalStream.tee();
  }

  toReadableStream(): ReadableStream<ChatCompletionChunk> {
    return this.originalStream.toReadableStream();
  }
}
