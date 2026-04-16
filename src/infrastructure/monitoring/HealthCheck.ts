/**
 * HealthCheck.ts
 * Simple health check for monitoring.
 *
 * @version 1.0.0
 */

export class HealthCheck {
  static async check(): Promise<{ status: string; webgpu: boolean; indexedDB: boolean }> {
    const webgpu = 'gpu' in navigator;
    const indexedDB = 'indexedDB' in window;
    return {
      status: 'ok',
      webgpu,
      indexedDB,
    };
  }
}
