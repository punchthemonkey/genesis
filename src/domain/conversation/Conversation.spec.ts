/**
 * Conversation.spec.ts
 * Unit tests for Conversation aggregate.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Conversation } from './Conversation';

describe('Conversation', () => {
  let conv: Conversation;

  beforeEach(() => {
    conv = Conversation.create();
  });

  it('should create empty conversation', () => {
    expect(conv.id).toBeDefined();
    expect(conv.turnCount).toBe(0);
  });

  it('should add turns and update timestamp', () => {
    const turn = conv.addTurn('Hello', 'Hi');
    expect(conv.turnCount).toBe(1);
    expect(turn.userMessage).toBe('Hello');
    expect(conv.updatedAt.getTime()).toBeGreaterThanOrEqual(turn.timestamp.getTime());
  });

  it('should get recent turns limited', () => {
    conv.addTurn('Q1', 'A1');
    conv.addTurn('Q2', 'A2');
    const recent = conv.getRecentTurns(1);
    expect(recent).toHaveLength(1);
    expect(recent[0].userMessage).toBe('Q2');
  });

  it('should prune old turns', () => {
    for (let i = 0; i < 10; i++) conv.addTurn(`Q${i}`, `A${i}`);
    const removed = conv.prune(5);
    expect(removed).toBe(5);
    expect(conv.turnCount).toBe(5);
    expect(conv.turns[0].userMessage).toBe('Q5');
  });

  it('should serialize and deserialize', () => {
    conv.addTurn('Hello', 'World', { skillId: 's1' });
    const json = conv.toJSON();
    const restored = Conversation.fromJSON(json);
    expect(restored).not.toBeNull();
    expect(restored!.id).toBe(conv.id);
    expect(restored!.turnCount).toBe(1);
    expect(restored!.turns[0].metadata.skillId).toBe('s1');
  });
});
