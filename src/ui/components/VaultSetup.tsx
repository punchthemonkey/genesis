/**
 * VaultSetup.tsx
 * UI component for master password creation and vault unlock.
 *
 * @version 1.0.0
 */

import { useState, useEffect } from 'preact/hooks';
import { useInjection } from '../hooks/useInjection';
import { TOKENS } from '@infrastructure/di/tokens';
import { IKeychain } from '@domain/ports/IKeychain';

export function VaultSetup({ onUnlocked }: { onUnlocked: () => void }) {
  const keychain = useInjection<IKeychain>(TOKENS.Keychain);
  const [mode, setMode] = useState<'init' | 'unlock'>('init');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const init = await keychain.isInitialized();
      if (!cancelled) {
        setMode(init.ok && init.value ? 'unlock' : 'init');
      }
    };
    check();
    return () => { cancelled = true; };
  }, [keychain]);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError('');
    try {
      const result = mode === 'init'
        ? await keychain.initialize(password)
        : await keychain.unlock(password);
      if (result.ok) {
        onUnlocked();
      } else {
        setError(result.error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="vault-setup">
      <h2>{mode === 'init' ? 'Create Master Password' : 'Unlock Vault'}</h2>
      <p>{mode === 'init'
        ? 'This password encrypts your data. It cannot be recovered.'
        : 'Enter your master password.'}
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onInput={e => setPassword(e.currentTarget.value)}
          placeholder="Master password"
          minLength={8}
          required
          disabled={loading}
        />
        {error && <p class="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : mode === 'init' ? 'Create Vault' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}
