/**
 * Orchestrator.spec.ts
 * Unit tests for Orchestrator domain service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Orchestrator } from './Orchestrator';
import { ILLMProvider, LLMResponse, LLMMessage } from '@domain/ports/ILLMProvider';
import { IToolExecutor } from '@domain/ports/IToolExecutor';
import { IEventEmitter } from '@domain/ports/IEventEmitter';
import { ok, err } from '@shared/types/Result';
import { TurnId } from '@shared/types/Brand';

describe('Orchestrator', () => {
  let mockLLM: ILLMProvider;
  let mockTools: IToolExecutor;
  let mockEventEmitter: IEventEmitter;
  let orchestrator: Orchestrator;

  beforeEach(() => {
    mockLLM = {
      load: vi.fn(),
      stream: vi.fn(),
      embed: vi.fn(),
      dispose: vi.fn()
    };
    mockTools = {
      execute: vi.fn(),
      canHandle: vi.fn(),
      listTools: vi.fn().mockReturnValue(['calculator'])
    };
    mockEventEmitter = {
      emit: vi.fn(),
      on: vi.fn()
    };
    orchestrator = new Orchestrator(mockLLM, mockTools, mockEventEmitter);
  });

  it('should stream response and return final LLMResponse', async () => {
    const mockResponse: LLMResponse = {
      id: 'resp1',
      content: 'Hello, world!',
      finishReason: 'stop'
    };
    const mockStream = async function* () {
      yield 'Hello';
      yield ', world!';
      return ok(mockResponse);
    };
    mockLLM.stream = vi.fn().mockImplementation(() => mockStream());

    const messages: LLMMessage[] = [{ role: 'user', content: 'Hi' }];
    const turnId = 'turn123' as TurnId;

    const result = await orchestrator.run(messages, turnId);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.content).toBe('Hello, world!');
    }
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('orchestrator:turn:started', expect.any(Object));
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('llm:stream:token', { token: 'Hello', turnId });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('llm:stream:token', { token: ', world!', turnId });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('orchestrator:turn:completed', { turnId, response: 'Hello, world!' });
  });

  it('should handle LLM error', async () => {
    const mockStream = async function* () {
      return err({ code: 'NETWORK', message: 'Offline' });
    };
    mockLLM.stream = vi.fn().mockImplementation(() => mockStream());

    const result = await orchestrator.run([{ role: 'user', content: 'Hi' }]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('LLM_ERROR');
    }
  });

  it('should handle tool calls and continue ReAct loop', async () => {
    const toolCallResponse: LLMResponse = {
      id: 'resp1',
      content: '',
      toolCalls: [{ id: 'call1', name: 'calculator', args: { expression: '2+2' } }],
      finishReason: 'tool_calls'
    };
    const finalResponse: LLMResponse = {
      id: 'resp2',
      content: 'The result is 4.',
      finishReason: 'stop'
    };

    const mockStream = async function* () {
      // First call returns tool call
      return ok(toolCallResponse);
    };
    mockLLM.stream = vi.fn()
      .mockImplementationOnce(() => mockStream())
      .mockImplementationOnce(() => (async function* () {
        yield 'The result is 4.';
        return ok(finalResponse);
      })());

    mockTools.execute = vi.fn().mockResolvedValue(ok({ callId: 'call1', output: 4 }));

    const messages: LLMMessage[] = [{ role: 'user', content: 'What is 2+2?' }];
    const result = await orchestrator.run(messages);

    expect(result.ok).toBe(true);
    expect(mockTools.execute).toHaveBeenCalledWith({ id: 'call1', name: 'calculator', args: { expression: '2+2' } });
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('orchestrator:tool:started', expect.any(Object));
    expect(mockEventEmitter.emit).toHaveBeenCalledWith('orchestrator:tool:completed', expect.any(Object));
  });

  it('should return error on tool execution failure', async () => {
    const toolCallResponse: LLMResponse = {
      id: 'resp1',
      content: '',
      toolCalls: [{ id: 'call1', name: 'calculator', args: { expression: 'invalid' } }],
      finishReason: 'tool_calls'
    };

    mockLLM.stream = vi.fn().mockImplementation(() => (async function* () {
      return ok(toolCallResponse);
    })());
    mockTools.execute = vi.fn().mockResolvedValue(err({ code: 'EXECUTION_FAILED', message: 'Invalid expression' }));

    const result = await orchestrator.run([{ role: 'user', content: 'Calculate' }]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('TOOL_ERROR');
    }
  });

  it('should enforce max iterations', async () => {
    const toolCallResponse: LLMResponse = {
      id: 'resp',
      content: '',
      toolCalls: [{ id: 'call1', name: 'calculator', args: { expression: '1+1' } }],
      finishReason: 'tool_calls'
    };

    mockLLM.stream = vi.fn().mockImplementation(() => (async function* () {
      return ok(toolCallResponse);
    })());
    mockTools.execute = vi.fn().mockResolvedValue(ok({ callId: 'call1', output: 2 }));

    const result = await orchestrator.run([{ role: 'user', content: 'Loop' }]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('MAX_ITERATIONS');
    }
  });
});
