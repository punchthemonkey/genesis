/**
 * agent-worker.ts
 * Web Worker host for specialist agents (Phase 2+).
 *
 * @version 1.0.0
 */

import { Task, Artifact } from '@domain/agent/A2AProtocol';

type WorkerMessage =
  | { type: 'execute_task'; payload: Task }
  | { type: 'task_result'; payload: Artifact };

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  if (type === 'execute_task') {
    const task = payload as Task;
    // Simulate agent work (placeholder)
    const artifact: Artifact = {
      id: crypto.randomUUID(),
      name: 'result',
      contentType: 'text/plain',
      data: `Simulated response for: ${task.instruction}`
    };
    self.postMessage({ type: 'task_result', payload: artifact });
  }
};
