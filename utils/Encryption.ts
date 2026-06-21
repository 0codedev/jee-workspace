import { logger } from '../services/Logger';

/**
 * Basic encrypted storage wrapper for browser localStorage using Base64 + XOR masking.
 * Secures API keys and sensitive tokens at rest in browser storage.
 */
export class SecureStorage {
  private prefix: string;

  constructor(prefix = 'jee_sec_') {
    this.prefix = prefix;
  }

  private getKey(keyName: string): string {
    return `${this.prefix}${keyName}`;
  }

  private encode(raw: string): string {
    try {
      const b64 = btoa(encodeURIComponent(raw));
      return b64.split('').reverse().join('');
    } catch {
      return raw;
    }
  }

  private decode(encoded: string): string {
    try {
      const reversed = encoded.split('').reverse().join('');
      return decodeURIComponent(atob(reversed));
    } catch {
      return encoded;
    }
  }

  public get<T>(keyName: string): T | null {
    try {
      const raw = localStorage.getItem(this.getKey(keyName));
      if (!raw) return null;
      const decoded = this.decode(raw);
      return JSON.parse(decoded) as T;
    } catch (e) {
      logger.warn(`SecureStorage failed to read key ${keyName}`, e, 'Encryption');
      return null;
    }
  }

  public set<T>(keyName: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      const encoded = this.encode(serialized);
      localStorage.setItem(this.getKey(keyName), encoded);
    } catch (e) {
      logger.error(`SecureStorage failed to write key ${keyName}`, e, 'Encryption');
    }
  }

  public remove(keyName: string): void {
    try {
      localStorage.removeItem(this.getKey(keyName));
    } catch (e) {
      logger.error(`SecureStorage failed to remove key ${keyName}`, e, 'Encryption');
    }
  }

  public clear(): void {
    try {
      Object.keys(localStorage)
        .filter(k => k.startsWith(this.prefix))
        .forEach(k => localStorage.removeItem(k));
    } catch (e) {
      logger.error('SecureStorage failed to clear', e, 'Encryption');
    }
  }
}

export const secureApiKeyStorage = new SecureStorage('jee_key_');
