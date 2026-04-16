/**
 * IKeychain.ts
 * Port for secure storage of secrets (API keys, tokens).
 *
 * @version 2.0.0 - Added brute‑force protection and HMAC verification.
 */

import { Result } from '@shared/types/Result';
import { KeyHandle } from '@shared/types/Brand';

export type KeychainError =
  | { code: 'NOT_INITIALIZED'; message: string }
  | { code: 'ALREADY_INITIALIZED'; message: string }
  | { code: 'INVALID_PASSWORD'; message: string }
  | { code: 'LOCKED_OUT'; message: string }
  | { code: 'NOT_FOUND'; message: string }
  | { code: 'CRYPTO_ERROR'; message: string }
  | { code: 'STORAGE_ERROR'; message: string };

export interface KeychainEntry {
  handle: KeyHandle;
  label: string;
  createdAt: Date;
}

/**
 * Keychain port for secure storage of secrets.
 * All secrets are encrypted with a key derived from the master password.
 */
export interface IKeychain {
  /**
   * Initializes the vault with a master password.
   * @error `ALREADY_INITIALIZED` – vault already exists.
   */
  initialize(masterPassword: string): Promise<Result<void, KeychainError>>;

  /**
   * Unlocks the vault using the master password.
   * Implements brute‑force protection: after 5 failed attempts, lockout for increasing durations.
   * @error `INVALID_PASSWORD` – password incorrect.
   * @error `LOCKED_OUT` – Too many failed attempts. Retry after lockout period.
   * @error `NOT_INITIALIZED` – vault not set up.
   */
  unlock(masterPassword: string): Promise<Result<void, KeychainError>>;

  /**
   * Locks the vault, clearing the decrypted key from memory.
   */
  lock(): Promise<Result<void, KeychainError>>;

  /**
   * Stores a secret under a label.
   */
  store(label: string, secret: string): Promise<Result<KeyHandle, KeychainError>>;

  /**
   * Retrieves a secret.
   */
  retrieve(handle: KeyHandle): Promise<Result<string, KeychainError>>;

  /**
   * Deletes a secret.
   */
  revoke(handle: KeyHandle): Promise<Result<void, KeychainError>>;

  /**
   * Lists all stored handles and labels.
   */
  list(): Promise<Result<KeychainEntry[], KeychainError>>;

  /**
   * Checks if the vault is currently unlocked.
   */
  isUnlocked(): boolean;

  /**
   * Checks if a vault exists (initialized).
   */
  isInitialized(): Promise<Result<boolean, KeychainError>>;
}
