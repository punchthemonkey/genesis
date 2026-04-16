/**
 * MockLLMProvider.ts
 * Programmable mock LLM provider for testing and development.
 *
 * @version 1.0.0
 */

import {
  ILLMProvider,
  LLMMessage,
  LLMRequestOptions,
  LLMResponse,
  LoadProgress,
  LLMError,
  ToolCall
} from '@domain/ports/ILLMProvider';
import { Result, ok, err } from '@shared/types/Result';

type ScriptedResponse =
  | string
  | (() => AsyncGenerator<string, Result<LLMResponse, LLMError>>);

export class MockLLMProvider implements ILLMProvider {
  private scripted: Array<{
    match: (messages: LLMMessage[]) => boolean;
    response: ScriptedResponse;
  }> = [];
  private defaultResponse = "I'm a mock assistant. You said: {lastUserMessage}";

  addResponse(match: (messages: LLMMessage[]) => boolean, response: ScriptedResponse): void {
    this.scripted.push({ match, response });
  }

  setDefaultResponse(template: string): void {
    this.defaultResponse = template;
  }

  reset(): void {
    this.scripted = [];
  }

  async *load(modelId: string): AsyncGenerator<LoadProgress, Result<void, LLMError>> {
    for (let i = 0; i <= 10; i++) {
      yield { progress: i / 10, text: `Loading mock model ${modelId}...` };
      await new Promise(r => setTimeout(r, 50));
    }
    return ok(undefined);
  }

  async *stream(
    messages: LLMMessage[],
    options?: LLMRequestOptions
  ): AsyncGenerator<string, Result<LLMResponse, LLMError>> {
    for (const script of this.scripted) {
      if (script.match(messages)) {
        if (typeof script.response === 'string') {
          yield* this.simulateStreaming(script.response);
          return ok({
            id: `mock-${Date.now()}`,
            content: script.response,
            finishReason: 'stop'
          });
        } else {
          return yield* script.response();
        }
      }
    }

    const lastUser = messages.filter(m => m.role === 'user').pop();
    const content = this.defaultResponse.replace('{lastUserMessage}', lastUser?.content ?? '');
    yield* this.simulateStreaming(content);
    return ok({ id: `mock-${Date.now()}`, content, finishReason: 'stop' });
  }

  private async *simulateStreaming(text: string): AsyncGenerator<string> {
    const words = text.split(' ');
    for (const word of words) {
      yield word + ' ';
      await new Promise(r => setTimeout(r, 20));
    }
  }

  async embed(text: string): Promise<Result<Float32Array, LLMError>> {
    const embedding = new Float32Array(384);
    for (let i = 0; i < 384; i++) embedding[i] = Math.sin(i * 0.1) * 0.1;
    return ok(embedding);
  }

  async dispose(): Promise<void> {
    this.reset();
  }
}
