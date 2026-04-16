import { describe, it, expect, beforeEach } from 'vitest';
import { WebCryptoKeychain } from './WebCryptoKeychain';
import 'fake-indexeddb/auto';

describe('WebCryptoKeychain', () => {
  let keychain: WebCryptoKeychain;

  beforeEach(async () => {
    keychain = new WebCryptoKeychain();
    await new Promise(r => indexedDB.deleteDatabase('genesis-db').onsuccess = r);
  });

  it('should initialize and unlock', async () => {
    const init = await keychain.initialize('test123');
    expect(init.ok).toBe(true);

    const unlock = await keychain.unlock('test123');
    expect(unlock.ok).toBe(true);
    expect(keychain.isUnlocked()).toBe(true);
  });

  it('should reject wrong password', async () => {
    await keychain.initialize('test123');
    const unlock = await keychain.unlock('wrong');
    expect(unlock.ok).toBe(false);
    if (!unlock.ok) expect(unlock.error.code).toBe('INVALID_PASSWORD');
  });

  it('should store and retrieve secret', async () => {
    await keychain.initialize('test123');
    await keychain.unlock('test123');
    const store = await keychain.store('api-key', 'secret-value');
    expect(store.ok).toBe(true);
    const handle = store.ok ? store.value : null;
    const retrieve = await keychain.retrieve(handle!);
    expect(retrieve.ok).toBe(true);
    if (retrieve.ok) expect(retrieve.value).toBe('secret-value');
  });
});
