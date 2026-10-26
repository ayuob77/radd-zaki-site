# رد ذكي — Radd AI demo site

Arabic AI customer-service chatbot demo. Hosted on Cloudflare Pages (project `radd-zaki`), auto-deployed from `main`.

- Static files at the repo root; `_worker.js` (Pages advanced mode) handles `/api/chat`, `/api/status` and `/whatsapp`.
- Contact: only «للتواصل والاستفسار: contact@raddzaki.com». WhatsApp buttons are inactive; `/whatsapp` redirects home (`WA_LINK` in `_worker.js` or the Pages env var `WA_LINK`).
- Canonical home: https://raddzaki.com (old hosts radd.riyalbyriyal.app, www.raddzaki.com, radd-zaki.pages.dev 301 here, path kept).
- Chat: relays to the existing backend unless a `GEMINI_API_KEY` secret is set on the Pages project (then it calls the model directly).
- No phone numbers anywhere on this site.
