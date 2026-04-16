/**
 * DatabaseManager.ts
 * Centralized IndexedDB management for Genesis.
 * Ensures a single version-controlled schema migration path for all stores.
 *
 * @version 3.0.0
 * @author Genesis Architecture Team
 * @see GOAT Standard Pillar 7: Deployment & Offline Readiness
 */

const DB_NAME = 'genesis-db';
const DB_VERSION = 3;

/**
 * Singleton manager for the Genesis IndexedDB database.
 * All infrastructure adapters must use this manager to obtain a database connection.
 */
export class DatabaseManager {
  private static db: IDBDatabase | null = null;
  private static openPromise: Promise<IDBDatabase> | null = null;

  /**
   * Opens the Genesis database, creating or upgrading it if necessary.
   * @performance Must complete in <100ms after initial upgrade.
   * @returns A promise resolving to the IDBDatabase instance.
   */
  static async open(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.openPromise) {
      return this.openPromise;
    }

    this.openPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        this.openPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.openPromise = null;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.handleUpgrade(db, event.oldVersion);
      };
    });

    return this.openPromise;
  }

  /**
   * Handles schema migrations from any previous version to the current version.
   * @param db The database being upgraded.
   * @param oldVersion The previous version number.
   */
  private static handleUpgrade(db: IDBDatabase, oldVersion: number): void {
    // Version 1: Initial stores (conversations, memories)
    if (oldVersion < 1) {
      if (!db.objectStoreNames.contains('conversations')) {
        db.createObjectStore('conversations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('memories')) {
        db.createObjectStore('memories', { keyPath: 'id' });
      }
    }

    // Version 2: Keychain store added
    if (oldVersion < 2) {
      if (!db.objectStoreNames.contains('keychain')) {
        db.createObjectStore('keychain');
      }
    }

    // Version 3: Skills store added
    if (oldVersion < 3) {
      if (!db.objectStoreNames.contains('skills')) {
        db.createObjectStore('skills', { keyPath: 'id' });
      }
    }
  }

  /**
   * Closes the database connection and resets the singleton.
   * Useful for testing or when the user logs out.
   */
  static close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.openPromise = null;
  }

  /**
   * Deletes the entire Genesis database.
   * This operation is irreversible and requires user confirmation.
   * @returns A promise that resolves when the database is deleted.
   */
  static async deleteDatabase(): Promise<void> {
    this.close();
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Database deletion blocked'));
    });
  }
}
