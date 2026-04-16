/**
 * Conductor.ts
 * Multi‑agent orchestration service. Delegates tasks to specialist agents.
 *
 * @version 1.0.0
 */

import { ILLMProvider, LLMMessage } from '../ports/ILLMProvider';
import { IToolExecutor } from '../ports/IToolExecutor';
import { IEventEmitter } from '../ports/IEventEmitter';
import { Result, ok, err } from '@shared/types/Result';
import { TurnId, generateId } from '@shared/types/Brand';
import { AgentCard } from './A2AProtocol';

export type ConductorError =
  | { code: 'LLM_ERROR'; message: string }
  | { code: 'DELEGATION_FAILED'; message: string };

export class Conductor {
  constructor(
    private llmProvider: ILLMProvider,
    private toolExecutor: IToolExecutor,
    private eventEmitter: IEventEmitter,
    private availableAgents: AgentCard[] = []
  ) {}

  async run(
    messages: LLMMessage[],
    turnId: TurnId = generateId<TurnId>()
  ): Promise<Result<string, ConductorError>> {
    this.eventEmitter.emit('conductor:turn:started', {
      turnId,
      userMessage: messages[messages.length - 1]?.content
    });

    // Simple heuristic delegation (Phase 2). Will be replaced with LLM‑based routing.
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()?.content.toLowerCase() || '';
    if (lastUserMsg.includes('search') || lastUserMsg.includes('browse')) {
      const navigator = this.availableAgents.find(a => a.id === 'web-navigator');
      if (navigator) {
        this.eventEmitter.emit('conductor:delegating', { agentId: navigator.id, reason: 'Web search requested' });
        const response = `[WebNavigator] I found results for "${lastUserMsg}"...`;
        this.eventEmitter.emit('conductor:turn:completed', { turnId, response });
        return ok(response);
      }
    }

    const response = await this.llmDirect(messages);
    if (response.ok) {
      this.eventEmitter.emit('conductor:turn:completed', { turnId, response: response.value });
    }
    return response;
  }

  private async llmDirect(messages: LLMMessage[]): Promise<Result<string, ConductorError>> {
    const stream = this.llmProvider.stream(messages);
    let fullResponse = '';
    let final: any;
    for await (const chunk of stream) {
      if (typeof chunk === 'string') {
        fullResponse += chunk;
        this.eventEmitter.emit('llm:stream:token', { token: chunk });
      } else {
        final = chunk;
      }
    }
    if (final && final.ok) {
      return ok(final.value.content);
    }
    return err({ code: 'LLM_ERROR', message: 'LLM failed' });
  }
}
