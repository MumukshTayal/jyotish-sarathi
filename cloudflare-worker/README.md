# Jyotish Sarathi — Groq AI Proxy (Cloudflare Worker)

This tiny serverless proxy keeps your **Groq API key secret** so it is never
exposed in the GitHub Pages site. The browser calls this worker; the worker adds
the key and forwards the request to Groq.

```
Browser (GitHub Pages, NO key)  ->  Cloudflare Worker (holds key)  ->  Groq API
```

## One-time setup

1. Create a free account at https://dash.cloudflare.com and install the CLI:
   ```bash
   npm install -g wrangler
   wrangler login
   ```

2. From this `cloudflare-worker/` folder, store your Groq key as a secret
   (it is encrypted, never committed to git):
   ```bash
   wrangler secret put GROQ_API_KEY
   # paste your Groq key when prompted
   ```

3. (Optional) Lock the worker to your site by editing `ALLOWED_ORIGIN` in
   `wrangler.toml`.

4. Deploy:
   ```bash
   wrangler deploy
   ```
   Wrangler prints a URL like `https://jyotish-ai.<your-subdomain>.workers.dev`.

5. Put that URL in the site. Edit `assets/js/ai.js` (or add it to each page),
   for example at the top of `ai.js`:
   ```js
   window.JYOTISH_AI_ENDPOINT = 'https://jyotish-ai.<your-subdomain>.workers.dev';
   ```

That's it — the AI buttons on Yoga/Dosha, Transit and Matching pages now work,
and the key stays private.
