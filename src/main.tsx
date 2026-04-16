/**
 * main.tsx
 * Application entry point. Initializes DI, renders App, registers service worker.
 *
 * @version 1.0.0
 */

import 'reflect-metadata';
import { render } from 'preact';
import { App } from './ui/App';
import './index.css';

render(<App />, document.getElementById('app')!);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          if (confirm('New version available. Refresh?')) location.reload();
        }
      });
    });
  });
}
