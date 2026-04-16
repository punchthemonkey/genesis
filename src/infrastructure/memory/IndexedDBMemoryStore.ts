/**
 * IndexedDBMemoryStore.ts
 * IndexedDB implementation of IMemoryStore.
 *
 * @version 2.0.0 - Uses centralized DatabaseManager.
 */

import {
  IMemoryStore,
  MemoryError,
  MemorySearchOptions,
  MemorySearchResult
} from '@domain/ports/IMemoryStore';
import { Conversation, ConversationId } from '@domain/conversation/Conversation';
import { MemoryEntry, MemoryId } from '@domain/memory/MemoryEntry';
import { Skill, SkillId } from '@domain/skill/Skill';
import { Result, ok, err } from '@shared/types/Result';
import { DatabaseManager } from '../db/DatabaseManager';

const STORE_CONVERSATIONS = 'conversations';
const STORE_MEMORIES = 'memories';
const STORE_SKILLS = 'skills';

export class IndexedDBMemoryStore implements IMemoryStore {
  private async withStore<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>
  ): Promise<T> {
    const db = await DatabaseManager.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = operation(store);
      
      tx.oncomplete = () => {
        if (result instanceof Promise) {
          result.then(resolve).catch(reject);
        } else {
          resolve(result.result);
        }
      };
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(new Error(`Transaction aborted: ${tx.error?.message}`));
      
      if (!(result instanceof Promise)) {
        result.onerror = () => reject(result.error);
      }
    });
  }

  private mapError(e: unknown): MemoryError {
    if (e instanceof DOMException) {
      if (e.name === 'QuotaExceededError') {
        return { code: 'QUOTA_EXCEEDED', message: 'Storage quota exceeded' };
      }
      if (e.name === 'TransactionInactiveError') {
        return { code: 'TRANSACTION_TIMEOUT', message: 'Transaction timed out' };
      }
    }
    return { code: 'STORAGE_UNAVAILABLE', message: e instanceof Error ? e.message : String(e) };
  }

  // --- Conversations ---
  async saveConversation(conv: Conversation): Promise<Result<void, MemoryError>> {
    try {
      await this.withStore(STORE_CONVERSATIONS, 'readwrite', store => store.put(conv.toJSON()));
      return ok(undefined);
    } catch (e) {
      return err(this.mapError(e));
    }
  }

  async getConversation(id: ConversationId): Promise<Result<Conversation, MemoryError>> {
    try {
      const data = await this.withStore(STORE_CONVERSATIONS, 'readonly', store => store.get(id));
      if (!data) return err({ code: 'NOT_FOUND', message: `Conversation ${id} not found` });
      const conv = Conversation.fromJSON(data);
      if (!conv) return err({ code: 'SERIALIZATION_FAILED', message: 'Failed to deserialize' });
      return ok(conv);
    } catch (e) {
      return err(this.mapError(e));
    }
  }

  async listConversations(limit?: number): Promise<Result<Conversation[], MemoryError>> {
    try {
      const all = await this.withStore(STORE_CONVERSATIONS, 'readonly', store => store.getAll());
      let convs = all.map(data => Conversation.fromJSON(data)).filter(c => c !== null) as Conversation[];
      convs.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      if (limit) convs = convs.slice(0, limit);
      return ok(convs);
    } catch (e) {
      return err(this.mapError(e));
    }
  }

  async deleteConversation(id: ConversationId): Promise<Result<void, MemoryError>> {
    try {
      await this.withStore(STORE_CONVERSATIONS, 'readwrite', store => store.delete(id));
      return ok(undefined);
    } catch (e) {
      return err(this.mapError(e));
    }
  }

  // --- Memories ---
  async saveMemory(entry: MemoryEntry): Promise<Result<void, MemoryError>> {
    try {
      await this.withStore(STORE_MEMORIES, 'readwrite', store => store.put(entry.toJSON()));
      return ok(undefined);
    } catch (e) {
      return err(this.mapError(e));
    }
  }

  async searchMemories(
    queryEmbedding: Float32Array,
    options?: MemorySearchOptions
  ): Promise<Result<MemorySearchResult[], MemoryError>> {
    try {
      const allData = await this.withStore(STORE_MEMORIES, 'readonly', store => store.getAll());
      const entries = allData.map(data => MemoryEntry.fromJSON(data)).filter(e => e !== null) as MemoryEntry[];
      const limit = options?.limit ?? 10;
      const threshold = options?.threshold ?? 0.0;
      const results: MemorySearchResult[] = [];
      for (const entry of entries) {
        const sim = entry.cosineSimilarity(queryEmbedding);
        if (sim >= threshold) results.push({ entry, similarity: sim });
      }
      results.sort((a, b) => b.similarity - a.similarity);
      return ok(results.slice(0, limit));
    } catch (e) {
      return err(this.mapError(e));
    }
  }

  async getMemory(id: MemoryId): Promise<Result<MemoryEntry, MemoryError>> {
    try {
      const data = await this.withStore(STORE_MEMORIES, 'readonly', store => store.get(id));
      if (!data) return err({ code: 'NOT_FOUND', message: 'Not found' });
      const entry = MemoryEntry.fromJSON(data);
      return entry ? ok(entry) : err({ code: 'SERIALIZATION_FAILED', message: 'Invalid data' });
    } catch (e) {
      return err(this.mapError(e));
    }
  }

  async deleteMemory(id: MemoryId): Promise<Result<void, MemoryError>> {
    try {
      await this.withStore(STORE_MEMORIES, 'readwrite', store => store.delete(id));
      return ok(undefined);
    } catch (e) {
      return err(this.mapError(e));
    }
  }

  // --- Skills ---
  async saveSkill(skill: Skill): Promise<Result<void, MemoryError>> {
    try {
      await this.withStore(STORE_SKILLS, 'readwrite', store => store.put(skill.toJSON()));
      return ok(undefined);
    } catch (e) {
      return err(this.mapError(e));
    }
  }

  async getSkill(id: SkillId): Promise<Result<Skill, MemoryError>> {
    try {
      const data = await this.withStore(STORE_SKILLS, 'readonly', store => store.get(id));
      if (!data) return err({ code: 'NOT_FOUND', message: 'Skill not found' });
      const skill = Skill.fromJSON(data);
      return skill ? ok(skill) : err({ code: 'SERIALIZATION_FAILED', message: 'Invalid skill data' });
    } catch (e) {
      return err(this.mapError(e));
    }
  }

  async listSkills(): Promise<Result<Skill[], MemoryError>> {
    try {
      const all = await this.withStore(STORE_SKILLS, 'readonly', store => store.getAll());
      const skills = all.map(data => Skill.fromJSON(data)).filter(s => s !== null) as Skill[];
      return ok(skills);
    } catch (e) {
      return err(this.mapError(e));
    }
  }

  async deleteSkill(id: SkillId): Promise<Result<void, MemoryError>> {
    try {
      await this.withStore(STORE_SKILLS, 'readwrite', store => store.delete(id));
      return ok(undefined);
    } catch (e) {
      return err(this.mapError(e));
    }
  }

  // --- Maintenance ---
  async getStorageUsage(): Promise<Result<{ usedBytes: number; quotaBytes: number }, MemoryError>> {
    try {
      const estimate = await navigator.storage?.estimate();
      return ok({ usedBytes: estimate?.usage ?? 0, quotaBytes: estimate?.quota ?? 0 });
    } catch (e) {
      return err(this.mapError(e));
    }
  }

  async purgeAll(): Promise<Result<void, MemoryError>> {
    try {
      await this.withStore(STORE_CONVERSATIONS, 'readwrite', store => store.clear());
      await this.withStore(STORE_MEMORIES, 'readwrite', store => store.clear());
      await this.withStore(STORE_SKILLS, 'readwrite', store => store.clear());
      return ok(undefined);
    } catch (e) {
      return err(this.mapError(e));
    }
  }
}
