# Hifazat (حفاظت)

**Powered by Gemma 4.**
A private AI scam shield for families. Paste a suspicious message (a screenshot or text), or just speak what it said, and Hifazat tells you, in plain
English or large simple Urdu, whether it looks **safe, suspicious, or a scam**, why, and what to do next.

![License: MIT](https://img.shields.io/badge/license-MIT-0E5A4D)

## How Gemma 4 is used
Gemma 4 does all the analysis: it reads the screenshot (vision), extracts links, numbers and claims, and writes the verdict and explanation in Urdu.
A small verification step runs local link checks (non-https, raw IP, URL shorteners, lookalike domains). Optionally, extracted text can be
searched on the web (Tavily) and fed back to Gemma 4 for a second look.

## What it does
- Paste (Ctrl+V), upload or drag a screenshot, paste text, or dictate it with the mic (English or Urdu)
- Verdict: green safe / orange suspicious / full-screen red scam alert
- Red flags matched, plain-language explanation, one clear action
- "Listen" button reads the verdict and the scam alert aloud
- "Forward to family" button with a short warning (copy or WhatsApp)
- English by default with a one-tap switch to Urdu (right-to-left layout, larger text)

## Privacy
- **Local mode (default):** Gemma 4 runs on your computer through Ollama. Your screenshot never leaves your device.
- **Hosted mode (optional):** set a hosted Gemma 4 endpoint in `.env`. Then the screenshot goes to that provider.
- **Web check (optional, off by default):** only extracted link/phone/brand text is searched, never the image.
- **Voice typing (optional):** uses your browser's speech recognition. In Chrome and Edge that audio may be processed by the browser maker's servers. Type, paste or use a screenshot for a fully on-device check.

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
