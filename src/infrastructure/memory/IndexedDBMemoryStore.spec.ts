import { describe, it, expect, beforeEach } from 'vitest';
import { IndexedDBMemoryStore } from './IndexedDBMemoryStore';
import { Conversation } from '@domain/conversation/Conversation';
import { MemoryEntry } from '@domain/memory/MemoryEntry';
import 'fake-indexeddb/auto';

describe('IndexedDBMemoryStore', () => {
  let store: IndexedDBMemoryStore;

  beforeEach(async () => {
    store = new IndexedDBMemoryStore();
    await store.purgeAll();
  });

  it('should save and retrieve conversation', async () => {
    const conv = Conversation.create();
    conv.addTurn('Hi', 'Hello');
    const save = await store.saveConversation(conv);
    expect(save.ok).toBe(true);

    const get = await store.getConversation(conv.id);
    expect(get.ok).toBe(true);
    if (get.ok) expect(get.value.turnCount).toBe(1);
  });

  it('should save and search memories', async () => {
    const emb1 = new Float32Array([1, 0, 0]);
    const entry = MemoryEntry.create('first', emb1, 'explicit');
    await store.saveMemory(entry);

    const search = await store.searchMemories(new Float32Array([1, 0, 0]), { limit: 5, threshold: 0.5 });
    expect(search.ok).toBe(true);
    if (search.ok) {
      expect(search.value).toHaveLength(1);
      expect(search.value[0].entry.content).toBe('first');
    }
  });

  it('should handle skill CRUD', async () => {
    const skill = { id: 's1', name: 'Test', description: '', systemPrompt: '', allowedTools: [], version: '1.0.0' } as any;
    const save = await store.saveSkill(skill);
    expect(save.ok).toBe(true);
    const list = await store.listSkills();
    expect(list.ok).toBe(true);
    if (list.ok) expect(list.value).toHaveLength(1);
  });
});
