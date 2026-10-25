# رد ذكي — Radd AI demo site

Arabic AI customer-service chatbot demo. Hosted on Cloudflare Pages (project `radd-zaki`), auto-deployed from `main`.

- Static files at the repo root; `_worker.js` (Pages advanced mode) handles `/api/chat`, `/api/status` and `/whatsapp`.
- Contact link: `/whatsapp` redirects to `WA_LINK` in `_worker.js` (or the Pages env var `WA_LINK`).
- Chat: relays to the existing backend unless a `GEMINI_API_KEY` secret is set on the Pages project (then it calls the model directly).
- No phone numbers anywhere on this site.
