# Hifazat (حفاظت)

**Powered by Gemma 4.**
A private AI scam shield for your parents. Paste a suspicious message screenshot and Hifazat tells you, in large simple Urdu, whether it looks
**safe, suspicious, or a scam**, why, and what to do next.

![License: MIT](https://img.shields.io/badge/license-MIT-0E5A4D)

## How Gemma 4 is used
Gemma 4 does all the analysis: it reads the screenshot (vision), extracts links, numbers and claims, and writes the verdict and explanation in Urdu.
A small verification step checks links against a local list of official domains and, optionally, searches the web for scam reports.

## What it does
- Paste (Ctrl+V), upload or drag a screenshot, or paste text
- Verdict: green safe / orange suspicious / full-screen red scam alert
- Red flags matched, plain-Urdu explanation, one clear action
- "Forward to family" button that copies a short Urdu warning
- Huge text and buttons, right-to-left Urdu layout

## Privacy
- **Local mode (default):** Gemma 4 runs on your computer through Ollama. Your screenshot never leaves your device.
- **Hosted mode (optional):** set a hosted Gemma 4 endpoint in `.env`. Then the screenshot goes to that provider.
- **Web check (optional, off by default):** only extracted link/phone/brand text is searched, never the image.

## Quick start (Windows)
```
ollama pull gemma4:e4b
copy .env.example .env
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
cd frontend && npm install && npm run dev
```
Open http://localhost:3000. Quick model check: `python backend/scripts/smoke_test.py`.

## Limitations
Hifazat is a second opinion, not a guarantee. Small models make mistakes. If unsure, call your bank on the number printed on your card
and ask a family member.

## License
MIT. See `LICENSE`.

## Team
Add names here.
