import { secureApiKeyStorage } from "../../utils/Encryption";
import { logger } from "../Logger";

export type AIProviderName = 'google' | 'groq' | 'openrouter' | 'mistral' | 'cerebras' | 'cloudflare';

interface KeyState {
  key: string;
  exhaustedUntil: number; // timestamp, 0 if active
  latencyMs?: number;
}

interface ProviderPool {
  keys: KeyState[];
  currentIndex: number;
  callsToday: number;
  lastCallResetDate: string;
}

export class KeyPoolManager {
  private static instance: KeyPoolManager;
  private pool: Record<AIProviderName, ProviderPool>;

  private constructor() {
    this.pool = this.loadPool();
  }

  public static getInstance(): KeyPoolManager {
    if (!KeyPoolManager.instance) {
      KeyPoolManager.instance = new KeyPoolManager();
    }
    return KeyPoolManager.instance;
  }

  private defaultPool(): Record<AIProviderName, ProviderPool> {
    return {
      google: { keys: [], currentIndex: 0, callsToday: 0, lastCallResetDate: '' },
      groq: { keys: [], currentIndex: 0, callsToday: 0, lastCallResetDate: '' },
      openrouter: { keys: [], currentIndex: 0, callsToday: 0, lastCallResetDate: '' },
      mistral: { keys: [], currentIndex: 0, callsToday: 0, lastCallResetDate: '' },
      cerebras: { keys: [], currentIndex: 0, callsToday: 0, lastCallResetDate: '' },
      cloudflare: { keys: [], currentIndex: 0, callsToday: 0, lastCallResetDate: '' }
    };
  }

  private loadPool(): Record<AIProviderName, ProviderPool> {
    try {
      const stored = secureApiKeyStorage.get<any>('key_pool_v2');
      if (stored) {
        const pool = this.defaultPool();
        for (const p of Object.keys(pool)) {
          const provider = p as AIProviderName;
          const keyList = stored[provider] || [];
          pool[provider].keys = keyList.map((k: any) => {
            if (typeof k === 'string') {
              return { key: k, exhaustedUntil: 0 };
            }
            return { key: k.key, exhaustedUntil: k.exhaustedUntil || 0, latencyMs: k.latencyMs };
          });
          pool[provider].currentIndex = stored[provider + '_currentIndex'] || 0;
          pool[provider].callsToday = stored[provider + '_callsToday'] || 0;
          pool[provider].lastCallResetDate = stored[provider + '_lastCallResetDate'] || '';
        }
        return pool;
      }
    } catch (e) {
      logger.error("Failed to load Key Pool", e, 'KeyPoolManager');
    }
    return this.defaultPool();
  }

  private savePool(): void {
    try {
      const toStore: Record<string, any> = {};
      for (const p of Object.keys(this.pool)) {
        const provider = p as AIProviderName;
        toStore[provider] = this.pool[provider].keys;
        toStore[provider + '_currentIndex'] = this.pool[provider].currentIndex;
        toStore[provider + '_callsToday'] = this.pool[provider].callsToday;
        toStore[provider + '_lastCallResetDate'] = this.pool[provider].lastCallResetDate;
      }
      secureApiKeyStorage.set('key_pool_v2', toStore);
    } catch (e) {
      logger.error("Failed to save Key Pool", e, 'KeyPoolManager');
    }
  }

  public parseKeysInput(rawInput: string | string[]): string[] {
    if (Array.isArray(rawInput)) {
      return rawInput.map(k => k.trim()).filter(Boolean);
    }
    if (typeof rawInput === 'string') {
      return rawInput
        .split(/[\n,;]+/)
        .map(k => k.trim())
        .filter(Boolean);
    }
    return [];
  }

  public getKeys(provider: AIProviderName): string[] {
    return this.pool[provider]?.keys.map(k => k.key) || [];
  }

  public setKeys(provider: AIProviderName, keysInput: string | string[]): void {
    if (!this.pool[provider]) return;
    const currentKeys = this.pool[provider].keys;
    const cleanKeys = Array.from(new Set(this.parseKeysInput(keysInput)));
    
    this.pool[provider].keys = cleanKeys.map(key => {
      const match = currentKeys.find(c => c.key === key);
      return {
        key,
        exhaustedUntil: match ? match.exhaustedUntil : 0,
        latencyMs: match ? match.latencyMs : undefined
      };
    });
    this.pool[provider].currentIndex = 0;
    this.savePool();
  }

  public getNextKey(provider: AIProviderName): string | undefined {
    const pPool = this.pool[provider];
    if (!pPool || pPool.keys.length === 0) return undefined;

    const now = Date.now();
    const todayStr = new Date().toISOString().split('T')[0];
    if (pPool.lastCallResetDate !== todayStr) {
      pPool.callsToday = 0;
      pPool.lastCallResetDate = todayStr;
    }

    const activeKeys = pPool.keys.filter(k => k.exhaustedUntil <= now);
    if (activeKeys.length === 0) {
      logger.warn(`KeyPoolManager: All keys for provider ${provider} are exhausted.`, undefined, 'KeyPoolManager');
      return undefined;
    }

    activeKeys.sort((a, b) => (a.latencyMs || 1000) - (b.latencyMs || 1000));
    
    const selected = activeKeys[0];
    pPool.callsToday = (pPool.callsToday || 0) + 1;
    this.savePool();
    return selected.key;
  }

  public recordLatency(provider: AIProviderName, key: string, latencyMs: number): void {
    const pPool = this.pool[provider];
    if (!pPool) return;
    const keyState = pPool.keys.find(k => k.key === key);
    if (keyState) {
      keyState.latencyMs = keyState.latencyMs ? (keyState.latencyMs * 0.7 + latencyMs * 0.3) : latencyMs;
    }
  }

  public markKeyExhausted(provider: AIProviderName, key: string, cooldownMs: number = 5 * 60 * 1000): void {
    const pPool = this.pool[provider];
    if (!pPool) return;

    const keyState = pPool.keys.find(k => k.key === key);
    if (keyState) {
      keyState.exhaustedUntil = Date.now() + cooldownMs;
      logger.warn(`KeyPoolManager: Key for provider ${provider} marked exhausted for 5 min`, undefined, 'KeyPoolManager');
      this.savePool();
    }
  }

  public getCallStats(): Record<AIProviderName, { callsToday: number; totalKeys: number; activeKeys: number }> {
    const stats: any = {};
    const now = Date.now();
    const todayStr = new Date().toISOString().split('T')[0];
    
    for (const p of Object.keys(this.pool)) {
      const provider = p as AIProviderName;
      const pPool = this.pool[provider];
      
      if (pPool.lastCallResetDate !== todayStr) {
        pPool.callsToday = 0;
        pPool.lastCallResetDate = todayStr;
      }

      stats[provider] = {
        callsToday: pPool.callsToday || 0,
        totalKeys: pPool.keys.length,
        activeKeys: pPool.keys.filter(k => k.exhaustedUntil <= now).length
      };
    }
    return stats;
  }
}