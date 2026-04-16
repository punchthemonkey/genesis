/**
 * ILogger.ts
 * Logger port for structured logging across the application.
 *
 * @version 1.0.0
 * @see GOAT Standard Pillar 5: Production‑Grade Observability
 */

export interface ILogger {
  /**
   * Logs debug information (only enabled in development).
   */
  debug(message: string, ...args: unknown[]): void;

  /**
   * Logs informational messages.
   */
  info(message: string, ...args: unknown[]): void;

  /**
   * Logs warning messages.
   */
  warn(message: string, ...args: unknown[]): void;

  /**
   * Logs error messages.
   */
  error(message: string, ...args: unknown[]): void;
}
