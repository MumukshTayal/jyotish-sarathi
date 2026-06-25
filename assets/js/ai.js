// --- Jyotish Sarathi AI helper ---
// The Groq API key is NEVER stored here. All AI calls go through a serverless
// proxy (Cloudflare Worker / Vercel / Netlify function) that injects the key
// server-side. Set the proxy URL below after you deploy the worker.
//
// Example: window.JYOTISH_AI_ENDPOINT = 'https://jyotish-ai.<you>.workers.dev';
window.JYOTISH_AI_ENDPOINT = window.JYOTISH_AI_ENDPOINT || 'https://jyotish-ai.mumukshtayal29.workers.dev';

// Model id as shown on the Groq Cloud console.
window.JYOTISH_AI_MODEL = window.JYOTISH_AI_MODEL || 'qwen/qwen3.6-27b';

(function () {
  function stripMarkdown(text) {
    return String(text || '')
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]*)`/g, '$1')
      .replace(/^\s*[-*]\s+/gm, '• ')
      .trim();
  }
  window.stripMarkdown = stripMarkdown;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // Inline markdown -> HTML (bold, italic, code). Input is already HTML-escaped.
  function inlineMd(s) {
    return s
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  // Convert the AI's markdown into safe, nicely structured HTML.
  function formatAIHtml(text) {
    let src = String(text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const lines = src.split('\n');
    const html = [];
    // listStack tracks open lists: { type: 'ul'|'ol', indent: number }
    const listStack = [];

    function closeListsTo(indent) {
      while (listStack.length && listStack[listStack.length - 1].indent >= indent) {
        html.push(listStack.pop().type === 'ul' ? '</ul>' : '</ol>');
      }
    }
    function closeAllLists() {
      while (listStack.length) html.push(listStack.pop().type === 'ul' ? '</ul>' : '</ol>');
    }

    for (const raw of lines) {
      const line = raw.replace(/\s+$/, '');
      if (!line.trim()) { closeAllLists(); continue; }

      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        closeAllLists();
        const level = Math.min(6, heading[1].length + 2); // ## -> h4 etc, keep modest
        html.push(`<h${level}>${inlineMd(escapeHtml(heading[2].trim()))}</h${level}>`);
        continue;
      }

      const indent = (line.match(/^(\s*)/)[1] || '').replace(/\t/g, '  ').length;
      const ul = line.match(/^\s*[-*+]\s+(.*)$/);
      const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);

      if (ul || ol) {
        const type = ul ? 'ul' : 'ol';
        const content = (ul ? ul[1] : ol[1]).trim();
        const top = listStack[listStack.length - 1];
        if (!top || indent > top.indent) {
          html.push(type === 'ul' ? '<ul>' : '<ol>');
          listStack.push({ type, indent });
        } else {
          closeListsTo(indent + 1);
          const cur = listStack[listStack.length - 1];
          if (!cur || cur.indent !== indent) {
            html.push(type === 'ul' ? '<ul>' : '<ol>');
            listStack.push({ type, indent });
          }
        }
        html.push(`<li>${inlineMd(escapeHtml(content))}</li>`);
        continue;
      }

      // Plain paragraph line.
      closeAllLists();
      html.push(`<p>${inlineMd(escapeHtml(line.trim()))}</p>`);
    }
    closeAllLists();
    return html.join('\n');
  }
  window.formatAIHtml = formatAIHtml;

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
    return text;
  }
  window.askJyotishAI = askJyotishAI;
})();
