import { logger } from '../services/Logger';

export type Result<T, E = Error> =
  | { ok: true; data: T; error?: undefined }
  | { ok: false; error: E; data?: undefined };

export async function safeAsync<T, E = Error>(
  fn: () => Promise<T>,
  namespace = 'SafeAsync'
): Promise<Result<T, E>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err: any) {
    const error = err instanceof Error ? (err as E) : (new Error(String(err)) as E);
    logger.error(`Operation failed in ${namespace}: ${err?.message || err}`, err, namespace);
    return { ok: false, error };
  }
}
