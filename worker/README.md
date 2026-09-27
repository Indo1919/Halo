# Halo AI proxy

A small Cloudflare Worker that lets the public Halo site talk to Claude without putting an API key in the browser.

## Deploy (about five minutes)

1. Install dependencies: `cd worker && npm install`
2. Log in to Cloudflare: `npx wrangler login`
3. Add your Anthropic key as a secret (it is never stored in the repo):
   `npx wrangler secret put ANTHROPIC_API_KEY`
4. Check `ALLOWED_ORIGINS` in `wrangler.toml` matches the site that will call it
   (for GitHub Pages that is `https://<username>.github.io`).
5. Deploy: `npm run deploy`. Wrangler prints a URL like `https://halo-ai.<subdomain>.workers.dev`.
6. In the repo root, set `halo.config.js`:
   ```js
   window.HALO_CONFIG = { proxyUrl: 'https://halo-ai.<subdomain>.workers.dev/v1/messages' };
   ```
   Commit and push. Halo now answers live for every visitor; Settings > AI shows "Live".

## What it enforces

- Only origins in `ALLOWED_ORIGINS` can call it (browser CORS plus a server-side check).
- Only models in `MODELS`; anything else falls back to the first one.
- `max_tokens` is capped at `MAX_TOKENS`; system prompt and messages are size-limited.
- About `RATE_PER_MIN` requests per minute per IP (best effort, per Worker instance).
  For heavy public traffic, add a Cloudflare rate-limiting rule and a spend limit on your Anthropic account.
- Request bodies are never logged.

## Without a proxy

Halo still works: it falls back to scripted demo answers, and any visitor can paste their own key in
Settings > AI (it stays in their browser and goes straight to Anthropic). When Halo is opened as a Claude
artifact, it uses the viewer's own Claude account instead.
