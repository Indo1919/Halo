/**
 * Halo AI proxy — a tiny Cloudflare Worker that lets the public Halo site call Claude
 * without ever exposing an API key. The key lives in a Worker secret (ANTHROPIC_API_KEY).
 *
 * Guards: origin allowlist, model allowlist, max_tokens cap, prompt size caps,
 * best-effort per-IP rate limit, and no logging of request bodies.
 * Endpoint: POST /v1/messages (Anthropic Messages API shape, streaming supported).
 */
const buckets = new Map();

function allow(ip, perMinute) {
  const now = Date.now(), b = buckets.get(ip) || { n: 0, reset: now + 60000 };
  if (now > b.reset) { b.n = 0; b.reset = now + 60000; }
  b.n += 1; buckets.set(ip, b);
  if (buckets.size > 5000) buckets.clear();
  return b.n <= perMinute;
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, 'content-type': 'application/json' } });
}

function cleanMessages(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-12)
    .map(m => ({ role: m.role, content: m.content.slice(0, 8000) }));
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    const okOrigin = allowed.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': okOrigin ? origin : (allowed[0] || 'null'),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: okOrigin ? 204 : 403, headers: cors });
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/v1/messages') {
      return json({ error: { type: 'not_found', message: 'Use POST /v1/messages' } }, 404, cors);
    }
    if (!okOrigin) return json({ error: { type: 'forbidden', message: 'This origin is not allowed to use the proxy.' } }, 403, cors);
    if (!env.ANTHROPIC_API_KEY) return json({ error: { type: 'misconfigured', message: 'ANTHROPIC_API_KEY secret is not set.' } }, 500, cors);

    const ip = request.headers.get('CF-Connecting-IP') || 'anonymous';
    if (!allow(ip, Number(env.RATE_PER_MIN) || 20)) {
      return json({ error: { type: 'rate_limited', message: 'Too many requests. Try again in a minute.' } }, 429, cors);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: { type: 'bad_request', message: 'Body must be JSON.' } }, 400, cors); }

    const models = String(env.MODELS || 'claude-haiku-4-5-20251001').split(',').map(s => s.trim());
    const messages = cleanMessages(body.messages);
    if (!messages.length || messages[0].role !== 'user') {
      return json({ error: { type: 'bad_request', message: 'messages must start with a user turn.' } }, 400, cors);
    }
    const payload = {
      model: models.includes(body.model) ? body.model : models[0],
      max_tokens: Math.max(1, Math.min(Number(body.max_tokens) || 600, Number(env.MAX_TOKENS) || 1024)),
      messages,
      stream: body.stream !== false
    };
    if (typeof body.system === 'string') payload.system = body.system.slice(0, 24000);

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(payload)
    });
    const headers = new Headers(cors);
    headers.set('content-type', upstream.headers.get('content-type') || 'application/json');
    headers.set('cache-control', 'no-store');
    return new Response(upstream.body, { status: upstream.status, headers });
  }
};
