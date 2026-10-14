import { logger } from "../Logger";

interface ModelQuotaState {
  exhaustedUntil: number;
  callCountToday: number;
}

export class QuotaTracker {
  private static instance: QuotaTracker;
  private modelStates: Map<string, ModelQuotaState> = new Map();

  private constructor() {}

  public static getInstance(): QuotaTracker {
    if (!QuotaTracker.instance) {
      QuotaTracker.instance = new QuotaTracker();
    }
    return QuotaTracker.instance;
  }

  public trackCall(modelId: string): void {
    const state = this.modelStates.get(modelId) || { exhaustedUntil: 0, callCountToday: 0 };
    state.callCountToday += 1;
    this.modelStates.set(modelId, state);
  }

  public markExhausted(modelId: string, cooldownMs: number = 60 * 60 * 1000): void {
    const state = this.modelStates.get(modelId) || { exhaustedUntil: 0, callCountToday: 0 };
    state.exhaustedUntil = Date.now() + cooldownMs;
    this.modelStates.set(modelId, state);
    logger.warn(`QuotaTracker: Model ${modelId} marked exhausted for 1 hour`, undefined, 'QuotaTracker');
  }

  public isExhausted(modelId: string): boolean {
    const state = this.modelStates.get(modelId);
    if (!state) return false;
    return state.exhaustedUntil > Date.now();
  }
}