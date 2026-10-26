# Hifazat (حفاظت)

**Powered by Gemma 4.**
A private AI scam shield for families. Paste a suspicious message (a screenshot or text), or just speak what it said, and Hifazat tells you, in plain
English or large simple Urdu, whether it looks **safe, suspicious, or a scam**, why, and what to do next.

![License: MIT](https://img.shields.io/badge/license-MIT-0E5A4D)

## How Gemma 4 is used
Gemma 4 does all the analysis, in three roles. A **prosecutor** reads the message (and screenshot, via vision), hunts for scam signs and extracts links,
numbers and claims. A **defense** looks for reasons it could be genuine. A **judge** weighs both sides plus the link evidence and writes the verdict in
Urdu or English. That is three Gemma 4 requests per check, the first two in parallel.

Between the debate and the verdict, a verification step runs real checks on the links:
- **Link heuristics (always on):** non-https, raw IP, URL shorteners, lookalike domains.
- **Google Safe Browsing (optional):** Google's list of sites known for phishing and malware. A listed link forces a `scam` verdict. Set `SAFE_BROWSING_API_KEY`. Only the link text is sent.
- **Web search (optional):** `ENABLE_WEB_CHECK=true` plus `TAVILY_API_KEY`. Only the link, number or sender name is searched.
- **Agent mode (optional):** `USE_AGENT_VERIFY=true` lets Gemma 4 pick which tool to call (OpenAI Agents SDK, same Gemma endpoint). It runs together with web search.

`GET /api/health` reports which of these are switched on, and the home page shows the same list, so the site never claims a check that is not running.
A safety net in code means a message with red flags or bad link evidence can never come out as `safe`, and any failure returns `suspicious`.

## What it does
- Paste (Ctrl+V), upload or drag a screenshot, paste text, or dictate it with the mic (English or Urdu)
- Verdict: green safe / orange suspicious / full-screen red scam alert
- Red flags matched, plain-language explanation, one clear action
- "Listen" button reads the verdict and the scam alert aloud
- "Forward to family" button with a short warning (copy or WhatsApp)
- English by default with a one-tap switch to Urdu (right-to-left layout, larger text)

## Privacy
Nothing is stored: the backend keeps no database and writes no message to disk. Where a message travels depends on the mode.
- **Local mode (default):** Gemma 4 runs on your computer through Ollama. Your text and screenshot never leave your device.
- **Hosted mode:** if `LLM_BASE_URL` points to a hosted Gemma 4 (Google AI Studio, OpenRouter), your **text and screenshot are sent to that provider**, three requests per check, and are covered by that provider's terms. The site only shows its "private" badge in local mode. Do not call a hosted deployment private.
- **Safe Browsing (optional, off without a key):** only the extracted link text goes to Google. Never the message or image.
- **Web check (optional, off by default):** only a link, number or sender name is searched, never the image.
- **Voice typing (optional):** uses your browser's speech recognition. In Chrome and Edge that audio may be processed by the browser maker's servers. Type, paste or use a screenshot for a fully on-device check.
- **Clipboard watch (optional, off until you turn it on):** reads your clipboard while the page is open and only offers to check a new copy. Nothing is sent until you tap Check.
- **Secrets:** API keys live in `.env`, which is gitignored. Never paste them into chat or commit them.

## Checking messages automatically
A website cannot read your SMS or WhatsApp, because phones do not allow it. Three ways get close:
1. **Share to Hifazat (Android):** install the PWA, then share any message to it.
2. **Clipboard watch:** turn on "Watch my clipboard" in the checker. Copy a message and Hifazat offers to check it.
3. **Every new SMS (advanced):** set `LISTEN_TOKEN` in `.env`, then have an automation app (Tasker, MacroDroid, iOS Shortcuts) POST each new SMS to your server and show the verdict as a notification:
```
POST /api/listen
X-Listen-Token: <your LISTEN_TOKEN>
{"text": "<sms body>", "sender": "<sender>", "lang": "en"}
-> {"verdict": "scam", "red_flags": [...], "summary": "...", "what_to_do": "..."}
```
The endpoint is disabled (404) unless `LISTEN_TOKEN` is set, and it needs a server your phone can reach. In hosted mode every SMS forwarded this way goes to the hosted provider.

## Quick start (Windows)
```
ollama pull gemma4:e4b
copy .env.example .env

cd backend
uv sync
uv run python scripts/smoke_test.py ../samples/scam_sms.png
uv run uvicorn app.main:app --reload --port 8000

cd ../frontend
npm install
npm run dev
```
Open http://localhost:3000. API docs: http://localhost:8000/docs. Tests: `cd backend && uv run pytest`.

If Ollama ignores images on Windows or is too slow on CPU, switch to `gemma4:e2b` or use the hosted Gemma 4 lines in `.env.example`.

## Limitations
Hifazat is a second opinion, not a guarantee. Small models make mistakes. If unsure, call your bank on the number printed on your card
and ask a family member.

## License
MIT. See `LICENSE`.

## Team
Anees (backend, Gemma pipeline) and teammate (frontend). Karachi, MLH Hacktoberfest Hack Day.
