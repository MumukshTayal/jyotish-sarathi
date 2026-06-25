// --- Jyotish Sarathi AI helper ---
// The Groq API key is NEVER stored here. All AI calls go through a serverless
// proxy (Cloudflare Worker / Vercel / Netlify function) that injects the key
// server-side. Set the proxy URL below after you deploy the worker.
//
// Example: window.JYOTISH_AI_ENDPOINT = 'https://jyotish-ai.<you>.workers.dev';
window.JYOTISH_AI_ENDPOINT = window.JYOTISH_AI_ENDPOINT || '';

// Model id as shown on the Groq Cloud console.
window.JYOTISH_AI_MODEL = window.JYOTISH_AI_MODEL || 'qwen/qwen3.6-27b';

(function () {
  function stripMarkdown(text) {
    return String(text || '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/^\s*[-*]\s+/gm, '• ')
      .trim();
  }
  window.stripMarkdown = stripMarkdown;

  // Calls the proxy with a prompt and returns plain text.
  // Throws a descriptive error if the endpoint is not configured or fails.
  async function askJyotishAI(prompt, systemPrompt) {
    const endpoint = window.JYOTISH_AI_ENDPOINT;
    if (!endpoint) {
      throw new Error('AI is not configured yet. Deploy the proxy worker and set JYOTISH_AI_ENDPOINT.');
    }
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: window.JYOTISH_AI_MODEL,
        system: systemPrompt || 'You are an expert Vedic astrologer. Be practical, clear and respectful.',
        prompt: prompt
      })
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error('AI request failed (' + res.status + '). ' + txt.slice(0, 200));
    }
    const data = await res.json();
    const text = data.text || data.content || (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    if (!text) throw new Error('AI returned an empty response.');
    return stripMarkdown(text);
  }
  window.askJyotishAI = askJyotishAI;
})();
