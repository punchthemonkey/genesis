/**
 * ModelLoader.tsx
 * UI component for loading the local LLM model.
 *
 * @version 1.0.0
 */

import { useState } from 'preact/hooks';
import { useInjection } from '../hooks/useInjection';
import { TOKENS } from '@infrastructure/di/tokens';
import { ILLMProvider } from '@domain/ports/ILLMProvider';

export function ModelLoader({ onLoaded }: { onLoaded: () => void }) {
  const llm = useInjection<ILLMProvider>(TOKENS.LLMProvider);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      for await (const update of llm.load('')) {
        if ('progress' in update) {
          setProgress(update.progress);
          setStatus(update.text);
        } else if (update.ok) {
          onLoaded();
        } else {
          setError(update.error.message);
        }
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="model-loader">
      <h2>Loading AI Model</h2>
      {!loading && !error && <button onClick={load}>Load Model</button>}
      {loading && (
        <>
          <progress value={progress} max={1} />
          <p>{status}</p>
        </>
      )}
      {error && <p class="error">{error}</p>}
    </div>
  );
}
