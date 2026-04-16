/**
 * tool-worker.ts
 * Web Worker that executes tool calls in a sandboxed environment.
 *
 * @version 1.0.0
 */

import { ToolCall, ToolResult } from '@domain/ports/IToolExecutor';

type WorkerMessage =
  | { type: 'execute'; call: ToolCall; requestId: string }
  | { type: 'result'; result: ToolResult; error?: string; requestId: string };

const tools: Record<string, (args: Record<string, unknown>) => Promise<unknown>> = {
  calculator: async (args) => {
    const expr = args.expression as string;
    if (!expr) throw new Error('Missing expression');
    return Function('"use strict"; return (' + expr + ')')();
  }
};

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;
  if (msg.type === 'execute') {
    const { call, requestId } = msg;
    try {
      const tool = tools[call.name];
      if (!tool) throw new Error(`Tool ${call.name} not found`);
      const output = await tool(call.args);
      self.postMessage({
        type: 'result',
        result: { callId: call.id, output },
        requestId
      });
    } catch (error) {
      self.postMessage({
        type: 'result',
        result: {
          callId: call.id,
          output: null,
          error: error instanceof Error ? error.message : String(error)
        },
        requestId
      });
    }
  }
};
