// Persistent KV storage for Vercel serverless
// Uses Redis (via Vercel Marketplace) with TCP connection
// Falls back to globalThis for local dev (not persistent across cold starts)

import { createClient, type RedisClientType } from 'redis';

let client: RedisClientType | null = null;
let connecting = false;

async function getClient(): Promise<RedisClientType | null> {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (client?.isReady) return client;

  if (connecting) {
    // Wait for ongoing connection
    await new Promise(resolve => setTimeout(resolve, 100));
    return client?.isReady ? client : null;
  }

  connecting = true;
  try {
    client = createClient({ url, socket: { connectTimeout: 5000 } });
    client.on('error', () => { /* suppress connection errors */ });
    await client.connect();
    return client;
  } catch {
    client = null;
    return null;
  } finally {
    connecting = false;
  }
}

export async function kvGet<T>(key: string): Promise<T | null> {
  const c = await getClient();
  if (c) {
    const result = await c.get(key);
    if (result) {
      try { return JSON.parse(result) as T; } catch { return null; }
    }
    return null;
  }
  // Fallback: globalThis (only works within same warm instance)
  return ((globalThis as Record<string, unknown>)[`__kv_${key}`] as T) ?? null;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  const c = await getClient();
  if (c) {
    await c.set(key, JSON.stringify(value));
    return;
  }
  (globalThis as Record<string, unknown>)[`__kv_${key}`] = value;
}
