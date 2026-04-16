/**
 * ToolWorkerPool.spec.ts
 * Unit tests for ToolWorkerPool.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToolWorkerPool } from './ToolWorkerPool';
import { ToolResult } from '@domain/ports/IToolExecutor';

// Mock Worker
class MockWorker {
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: ErrorEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
}

vi.stubGlobal('Worker', MockWorker);

describe('ToolWorkerPool', () => {
  let pool: ToolWorkerPool;

  beforeEach(() => {
    pool = new ToolWorkerPool(2);
  });

  afterEach(() => {
    pool.terminate();
  });

  it('should execute a tool call and return result', async () => {
    const call = { id: 'c1', name: 'calculator', args: { expression: '2+2' } };
    const promise = pool.execute(call);

    const mockWorker = (pool as any).workers[0];
    const messageHandler = mockWorker.onmessage;
    expect(messageHandler).toBeDefined();

    const result: ToolResult = { callId: 'c1', output: 4 };
    messageHandler!({ data: { type: 'result', result, requestId: '0' } } as MessageEvent);

    const res = await promise;
    expect(res).toEqual(result);
  });

  it('should handle worker error and reject promise', async () => {
    const call = { id: 'c1', name: 'calculator', args: { expression: '2+2' } };
    const promise = pool.execute(call);

    const mockWorker = (pool as any).workers[0];
    const errorHandler = mockWorker.onerror;
    expect(errorHandler).toBeDefined();

    errorHandler!({ message: 'Worker crashed' } as ErrorEvent);

    await expect(promise).rejects.toThrow('Worker error');
  });

  it('should queue tasks when all workers are busy', async () => {
    const call1 = { id: 'c1', name: 'calculator', args: { expression: '1+1' } };
    const call2 = { id: 'c2', name: 'calculator', args: { expression: '2+2' } };
    const call3 = { id: 'c3', name: 'calculator', args: { expression: '3+3' } };

    const promise1 = pool.execute(call1);
    const promise2 = pool.execute(call2);
    const promise3 = pool.execute(call3);

    // Both workers busy, third queued
    expect((pool as any).queue.length).toBe(1);

    // Resolve first worker
    const worker0 = (pool as any).workers[0];
    worker0.onmessage!({ data: { type: 'result', result: { callId: 'c1', output: 2 }, requestId: '0' } } as MessageEvent);
    await promise1;

    // Now third task should be processed
    expect((pool as any).queue.length).toBe(0);

    // Resolve remaining
    worker0.onmessage!({ data: { type: 'result', result: { callId: 'c3', output: 6 }, requestId: '2' } } as MessageEvent);
    const worker1 = (pool as any).workers[1];
    worker1.onmessage!({ data: { type: 'result', result: { callId: 'c2', output: 4 }, requestId: '1' } } as MessageEvent);

    await expect(promise2).resolves.toEqual({ callId: 'c2', output: 4 });
    await expect(promise3).resolves.toEqual({ callId: 'c3', output: 6 });
  });

  it('should handle tool error from worker', async () => {
    const call = { id: 'c1', name: 'calculator', args: { expression: 'invalid' } };
    const promise = pool.execute(call);

    const mockWorker = (pool as any).workers[0];
    mockWorker.onmessage!({
      data: {
        type: 'result',
        result: { callId: 'c1', output: null, error: 'Invalid expression' },
        requestId: '0'
      }
    } as MessageEvent);

    await expect(promise).resolves.toEqual({ callId: 'c1', output: null, error: 'Invalid expression' });
  });
});
