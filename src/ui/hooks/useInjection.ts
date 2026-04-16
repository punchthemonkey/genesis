/**
 * useInjection.ts
 * Custom Preact hook to resolve dependencies from the DI container.
 *
 * @version 1.0.0
 */

import { container } from '@infrastructure/di/container';
import { InjectionToken } from 'tsyringe';

export function useInjection<T>(token: InjectionToken<T>): T {
  return container.resolve(token);
}
