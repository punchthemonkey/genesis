/**
 * EventTypes.ts
 * Typed event map for the Genesis EventBus.
 *
 * @version 1.0.0
 */

import { TurnId, ConversationId, SkillId } from '@shared/types/Brand';

export interface GenesisEvents {
  'orchestrator:turn:started': { turnId: TurnId; userMessage: string; conversationId: ConversationId };
  'orchestrator:turn:completed': { turnId: TurnId; response: string };
  'orchestrator:thought': { step: number; thought: string };
  'orchestrator:tool:started': { toolCall: { name: string; args: unknown } };
  'orchestrator:tool:completed': { result: unknown; durationMs: number };
  'llm:stream:token': { token: string; turnId: TurnId };
  'llm:load:progress': { progress: number; text: string };
  'conductor:turn:started': { turnId: TurnId; userMessage: string };
  'conductor:turn:completed': { turnId: TurnId; response: string };
  'conductor:delegating': { agentId: string; reason: string };
  'memory:quota:warning': { usedMB: number; limitMB: number };
  'skill:installed': { skillId: SkillId };
  'keychain:unlocked': {};
  'keychain:locked': {};
}

export type EventName = keyof GenesisEvents;
