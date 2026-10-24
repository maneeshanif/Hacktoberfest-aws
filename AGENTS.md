# AGENTS.md — rules for AI coding agents working on Hifazat

Read first: `docs/prd/PRD.md`, then this file. The PRD is the source of truth. If code and PRD disagree, ask or update the PRD.

## Hard rules (never break)
1. **Gemma 4 is the only model.** All AI steps (extract, verdict, optional audio) go through Gemma 4 via the OpenAI-compatible endpoint set in `.env` (`LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`). Never call another vendor's model. Never hardcode keys.
2. Repo stays public and MIT-licensed. Never commit `.env`, keys, or personal screenshots.
3. Never present a verdict as guaranteed. Wording: "may be a scam". On any failure return `suspicious`, never `safe`.
4. Never invent official domains, phone numbers, or sources. `backend/data/official_domains.json` entries must be verified on the organization's own site.
5. Only extracted text (links, phones, brand names) may go to web search. Never send the image anywhere except the configured Gemma endpoint.

## Stack
- Backend: Python 3.11+, FastAPI, pydantic, `openai` SDK, `openai-agents` (verify step only), Pillow, `tavily-python`.
- Frontend: Next.js (App Router, TypeScript), Tailwind, RTL Urdu.
- No database. No auth.

## Conventions
- API contract lives in PRD section 8. Do not change field names without updating the PRD and telling the other person.
- Prompts live in `backend/app/prompts.py`. Image goes before text in the message. Temperature 0. Request JSON output; validate with pydantic; retry once.
- Resize images so the long edge is at most 1024 px before sending.
- Pipeline order: extract -> verify -> verdict. If Agents SDK tool-calling misbehaves, call tools directly.
- UI: follow the Conclave AI theme in PRD section 9 (ink/chalk/forest, lime for actions, violet for live/speaking, Syne + Outfit + IBM Plex Mono, Noto Urdu fonts). Flat colour only, no gradients or heavy shadows. Urdu RTL, body text at least 22px, buttons at least 64px tall, red only for scam alerts, static fallback under reduced motion.
- Keep functions small. No new dependencies without a reason in the PR/commit message.

## Done means (run before saying "done")
- `python backend/scripts/smoke_test.py` passes (Gemma describes the image).
- Backend: `uvicorn app.main:app --reload` from `backend/`, `GET /api/health` returns ok.
- Frontend: `npm run build` passes in `frontend/`.
- Scam sample -> `scam` + red alert; normal sample -> `safe`.

## Commit style
Small commits, imperative messages ("Add domain lookalike check"). Commit often so history shows work done during the event.
