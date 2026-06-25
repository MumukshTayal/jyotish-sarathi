# 🕉 Jyotish Sarathi

**Free, practical Vedic astrology tools — live in your browser.**

### 🌐 Live site: **[jyotish-sarathi.pages.dev](https://jyotish-sarathi.pages.dev)**

A fast, static web app for Jyotish (Vedic astrology) with AI-assisted interpretation.

## Features

| Tool | Description |
| --- | --- |
| **Janma Kundli & Panchang** | Planetary positions, charts (D1/D9), panchang and printable report |
| **Kundli Matching** | Ashtakoota (Guna Milan) scoring out of 36, Mangal Dosha check |
| **Yoga & Dosha Engine** | Detects Mangal, Kaal Sarp, Gaja Kesari, Budhaditya and more |
| **Transit Analysis (Gochar)** | Saturn/Jupiter transits, Sade Sati, natal-chart highlights |
| **Muhurat Finder** | Auspicious time windows by purpose, date range and location |

AI insights on the Yoga/Dosha, Transit and Matching pages are powered by a model on **Groq**, served through a privacy-preserving Cloudflare Worker proxy (the API key is never exposed to the browser).

## Tech

- Static **HTML / CSS / JavaScript** — no build step
- [astronomy-engine](https://github.com/cosinekitty/astronomy) for planetary calculations (sidereal / Lahiri ayanamsa)
- Free geocoding via Open‑Meteo / Nominatim
- Hosted on **Cloudflare Pages**; AI proxy on **Cloudflare Workers**

## Project layout

```
*.html                 # pages (index, tools, yoga-dosha, transit-analysis, ...)
assets/css/styles.css  # styles
assets/js/             # engine (ephemeris.js), tools.js, ai.js, main.js
cloudflare-worker/     # Groq AI proxy (Worker) — see its README to deploy
```

## Deploy

The site is static; any change is published to Cloudflare Pages with:

```bash
git archive main | tar -x -C /tmp/jyotish-deploy
rm -rf /tmp/jyotish-deploy/cloudflare-worker
npx wrangler pages deploy /tmp/jyotish-deploy --project-name jyotish-sarathi --branch main
```

The AI proxy lives in [`cloudflare-worker/`](cloudflare-worker/) — see its README for setup.

---

*For educational and reflective purposes. Not a substitute for professional consultation.*
