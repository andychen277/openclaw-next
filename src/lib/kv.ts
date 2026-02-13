// Persistent KV storage for Vercel serverless
// Uses Upstash Redis REST API (via Vercel KV integration)
// Falls back to globalThis for local dev (not persistent across cold starts)

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

function isKVAvailable(): boolean {
  return !!(KV_URL && KV_TOKEN);
}

async function redisCommand(...args: string[]): Promise<unknown> {
  const res = await fetch(`${KV_URL}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KV_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  const data = await res.json();
  return data.result;
}

export async function kvGet<T>(key: string): Promise<T | null> {
  if (isKVAvailable()) {
    const result = await redisCommand('GET', key);
    if (typeof result === 'string') {
      try { return JSON.parse(result) as T; } catch { return null; }
    }
    return null;
  }
  // Fallback: globalThis (only works within same warm instance)
  return ((globalThis as Record<string, unknown>)[`__kv_${key}`] as T) ?? null;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  if (isKVAvailable()) {
    await redisCommand('SET', key, JSON.stringify(value));
    return;
  }
  (globalThis as Record<string, unknown>)[`__kv_${key}`] = value;
}
