/**
 * ToolWorkerPool.ts
 * Manages a pool of tool workers for concurrent, sandboxed execution.
 *
 * @version 1.0.0
 */

import { ToolCall, ToolResult } from '@domain/ports/IToolExecutor';

type PendingRequest = {
  resolve: (result: ToolResult) => void;
  reject: (error: Error) => void;
};

export class ToolWorkerPool {
  private workers: Worker[] = [];
  private available: Worker[] = [];
  private pending = new Map<string, PendingRequest>();
  private counter = 0;

  constructor(poolSize: number = navigator.hardwareConcurrency || 4) {
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(new URL('./tool-worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (e) => this.handleMessage(worker, e);
      worker.onerror = (err) => {
        console.error('Worker error:', err);
        this.pending.forEach(req => req.reject(new Error('Worker error')));
        this.pending.clear();
      };
      this.workers.push(worker);
      this.available.push(worker);
    }
  }

  private handleMessage(worker: Worker, event: MessageEvent) {
    const msg = event.data;
    if (msg.type === 'result') {
      const { requestId, result, error } = msg;
      const pending = this.pending.get(requestId);
      if (pending) {
        error ? pending.reject(new Error(error)) : pending.resolve(result);
        this.pending.delete(requestId);
      }
      this.available.push(worker);
      this.processQueue();
    }
  }

  private queue: Array<{
    call: ToolCall;
    resolve: (r: ToolResult) => void;
    reject: (e: Error) => void;
  }> = [];

  execute(call: ToolCall): Promise<ToolResult> {
    return new Promise((resolve, reject) => {
      this.queue.push({ call, resolve, reject });
      this.processQueue();
    });
  }

  private processQueue() {
    while (this.queue.length && this.available.length) {
      const worker = this.available.shift()!;
      const item = this.queue.shift()!;
      const requestId = (this.counter++).toString();
      this.pending.set(requestId, item);
      worker.postMessage({ type: 'execute', call: item.call, requestId });
    }
  }

  terminate() {
    this.workers.forEach(w => w.terminate());
    this.workers = [];
    this.available = [];
    this.pending.clear();
    this.queue = [];
  }
}
