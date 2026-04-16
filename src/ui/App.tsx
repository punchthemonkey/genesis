/**
 * App.tsx
 * Root application component. Manages vault, model loading, and main chat.
 *
 * @version 1.0.0
 */

import { useState, useEffect } from 'preact/hooks';
import { VaultSetup } from './components/VaultSetup';
import { ModelLoader } from './components/ModelLoader';
import { ChatWindow } from './components/ChatWindow';
import { useInjection } from './hooks/useInjection';
import { TOKENS } from '@infrastructure/di/tokens';
import { IKeychain } from '@domain/ports/IKeychain';

export function App() {
  const keychain = useInjection<IKeychain>(TOKENS.Keychain);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const online = () => setOffline(false);
    const offline = () => setOffline(true);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  useEffect(() => {
    if (keychain.isUnlocked()) setVaultUnlocked(true);
  }, []);

  if (!vaultUnlocked) {
    return (
      <div class="app">
        <h1>Genesis</h1>
        <VaultSetup onUnlocked={() => setVaultUnlocked(true)} />
      </div>
    );
  }

  return (
    <div class="app">
      <h1>Genesis</h1>
      {offline && <div class="offline-banner">⚠️ Offline — local chat works.</div>}
      {!modelLoaded
        ? <ModelLoader onLoaded={() => setModelLoaded(true)} />
        : <ChatWindow />
      }
    </div>
  );
}
