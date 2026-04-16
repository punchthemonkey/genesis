/**
 * A2AProtocol.ts
 * Agent‑to‑Agent protocol types for multi‑agent orchestration.
 *
 * @version 1.0.0
 */

import { Brand } from '@shared/types/Brand';

export type AgentId = Brand<string, 'AgentId'>;
export type TaskId = Brand<string, 'TaskId'>;

export interface AgentCard {
  id: AgentId;
  name: string;
  description: string;
  capabilities: string[]; // e.g., 'web_navigation', 'data_analysis'
  endpoint?: string; // For remote agents (future)
}

export interface Task {
  id: TaskId;
  instruction: string;
  context?: Record<string, unknown>;
}

export interface Artifact {
  id: string;
  name: string;
  contentType: string;
  data: unknown;
}

export interface A2AMessage {
  from: AgentId;
  to: AgentId;
  type: 'task_request' | 'task_result' | 'artifact' | 'status';
  payload: unknown;
}
