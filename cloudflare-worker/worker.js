// Cloudflare Worker: Groq AI proxy for Jyotish Sarathi.
// The GROQ_API_KEY is provided as an encrypted secret (wrangler secret put GROQ_API_KEY)
// and is never exposed to the browser or committed to git.

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export default {
  async fetch(request, env) {
    const allowOrigin = env.ALLOWED_ORIGIN || '*';
    const cors = {
      'Access-Control-Allow-Origin': allowOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, cors);
    }
    if (!env.GROQ_API_KEY) {
      return json({ error: 'Server is missing GROQ_API_KEY secret.' }, 500, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch (_) {
      return json({ error: 'Invalid JSON body.' }, 400, cors);
    }

    const prompt = (body.prompt || '').toString().slice(0, 6000);
    const system = (body.system || 'You are an expert Vedic astrologer.').toString().slice(0, 2000);
    const model = (body.model || 'qwen/qwen3.6-27b').toString();
    if (!prompt) {
      return json({ error: 'Missing prompt.' }, 400, cors);
    }

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + env.GROQ_API_KEY,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
        // Disable chain-of-thought so tokens go to the actual answer, not hidden
        // reasoning (which previously consumed the whole budget and returned empty).
        reasoning_effort: 'none',
        reasoning_format: 'hidden',
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => '');
      return json({ error: 'Groq error', detail: errText.slice(0, 500) }, groqRes.status, cors);
    }

    const data = await groqRes.json();
    const msg = data?.choices?.[0]?.message || {};
    // Prefer the answer; fall back to the reasoning field if content is empty.
    let text = (msg.content || msg.reasoning || '').toString();
    // Strip any <think>...</think> blocks the model may still emit inline.
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    return json({ text }, 200, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}
