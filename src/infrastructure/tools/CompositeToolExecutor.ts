/**
 * CompositeToolExecutor.ts
 * Composes multiple IToolExecutor implementations and delegates to a worker pool.
 *
 * @version 1.0.0
 */

import { IToolExecutor, ToolCall, ToolResult, ToolError } from '@domain/ports/IToolExecutor';
import { Result, ok, err } from '@shared/types/Result';
import { ToolWorkerPool } from '../workers/ToolWorkerPool';

export class CompositeToolExecutor implements IToolExecutor {
  private executors: IToolExecutor[] = [];
  private workerPool: ToolWorkerPool;

  constructor() {
    this.workerPool = new ToolWorkerPool();
  }

  register(executor: IToolExecutor): void {
    this.executors.push(executor);
  }

  async execute(call: ToolCall): Promise<Result<ToolResult, ToolError>> {
    // First check inline executors
    for (const executor of this.executors) {
      if (executor.canHandle(call.name)) {
        return executor.execute(call);
      }
    }
    // Otherwise delegate to worker pool (sandboxed)
    try {
      const result = await this.workerPool.execute(call);
      return ok(result);
    } catch (error) {
      return err({
        code: 'EXECUTION_FAILED',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  canHandle(toolName: string): boolean {
    return this.executors.some(e => e.canHandle(toolName)) || this.listTools().includes(toolName);
  }

  listTools(): string[] {
    // Tools available in worker are not dynamically listed yet; hardcode for now
    return ['calculator'];
  }
}
