/**
 * EventBus.ts
 * Type‑safe event bus implementing IEventEmitter.
 *
 * @version 1.0.0
 */

import { IEventEmitter } from '@domain/ports/IEventEmitter';

type EventCallback<T> = (payload: T) => void;

export class EventBus implements IEventEmitter {
  private listeners = new Map<string, Set<EventCallback<any>>>();

  on<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off<T>(event: string, callback: EventCallback<T>): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit<T>(event: string, payload: T): void {
    this.listeners.get(event)?.forEach(cb => cb(payload));
  }

  once<T>(event: string, callback: EventCallback<T>): void {
    const wrapper = (payload: T) => {
      callback(payload);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
