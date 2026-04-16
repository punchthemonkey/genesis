/**
 * tokens.ts
 * Dependency injection tokens for tsyringe.
 *
 * @version 1.0.0
 */

export const TOKENS = {
  LLMProvider: Symbol.for('ILLMProvider'),
  ToolExecutor: Symbol.for('IToolExecutor'),
  MemoryStore: Symbol.for('IMemoryStore'),
  Keychain: Symbol.for('IKeychain'),
  Logger: Symbol.for('ILogger'),
  EventBus: Symbol.for('IEventEmitter')
} as const;
